# Rencana payload produk

Apa saja yang harus terisi untuk satu produk, dari mana asalnya, siapa yang
boleh mengisinya, dan apa akibatnya kalau kosong.

Tiga sumber yang tidak boleh tertukar:

| Sumber | Sifat | Contoh |
|---|---|---|
| **Spesifikasi** | fakta tetap, bisa dicek publik | tanggal rilis, warna, jumlah kamera |
| **Jangkar sejarah** | perkiraan terbaik, tidak berubah lagi | harga rilis Indonesia, kurs saat rilis |
| **Observasi** | data pasar, append-only, berubah terus | harga toko, harga servis, harga komponen |

Yang di bawah ini mengatur dua kolom pertama. Observasi tidak pernah diisi
tangan lewat migrasi — ia hanya masuk lewat scraper dan `/catat`.

---

## 1. `products` — satu baris per model+varian

| Kolom | Wajib | Sumber | Kalau kosong |
|---|---|---|---|
| `kategori` | ya | spesifikasi | produk tidak muncul di `/[keluarga]` mana pun |
| `model` | ya | spesifikasi | — |
| `varian` | ya | spesifikasi | — |
| `slug` | ya | diturunkan dari model+varian | halaman produk tidak bisa dibuka |
| `rilis_at` | ya | spesifikasi | tahun rilis hilang di kartu seri dan sub anak tangga |
| `penerus_id` | tidak | spesifikasi | rasio komponen tidak bisa dipinjam dari generasi sebelah |
| `aktif` | ya | keputusan operator | `false` menyembunyikannya dari seluruh daftar |
| `bentuk` | ya | spesifikasi | ilustrasi produk jatuh ke siluet generik tanpa hotspot |
| `harga_rilis_id` | sebaiknya | jangkar sejarah | anak tangga "harga rilis Indonesia" tidak dirender |
| `harga_rilis_global` | sebaiknya | jangkar sejarah (USD) | anak tangga "harga rilis global" tidak dirender |
| `kurs_rilis` | ikut global | jangkar sejarah | sama seperti di atas, keduanya harus ada bersama |

**Aturan penamaan.** `model` tidak memuat kapasitas; kapasitas selalu di
`varian`. "iPhone 14" + "128GB", bukan "iPhone 14 128GB" + "-". Ini yang
membuat pemilih kapasitas di halaman produk bisa menemukan saudaranya.

**`slug`** = model+varian dihuruf kecilkan, spasi dan titik jadi tanda hubung,
tanda kurung dan koma dibuang. `iPhone 14 Pro Max` + `256GB` →
`iphone-14-pro-max-256gb`.

### `bentuk` (jsonb)

Dipakai dua hal berbeda, jadi isinya dua cabang:

```jsonc
{
  "keluarga": "iphone",          // menentukan ilustrasi mana yang dipakai
  "siluet": {                     // untuk kartu di /[keluarga]
    "muka": "island",             // "island" | "notch" | "notch-lebar" | "tombol" | "polos"
    "kamera": 3,                  // jumlah lensa belakang
    "bahan": "titanium",          // "titanium" | "baja" | "aluminium"
    "layar_inci": 6.7             // dipakai menskalakan lebar badan siluet
  },
  "zona_depan": [...],            // hotspot ilustrasi, lihat 031_bentuk_warna.sql
  "zona_belakang": [...],
  "zona_mesin_depan": [...],
  "zona_mesin_belakang": [...]
}
```

Zona hotspot boleh dibagi antar model segenerasi. `siluet` tidak boleh —
justru itu yang membedakan satu generasi dari yang lain di mata orang.

---

## 2. `product_colors` — satu baris per warna resmi

| Kolom | Wajib | Catatan |
|---|---|---|
| `product_id` | ya | |
| `nama` | ya | nama resmi Apple Indonesia, bukan terjemahan bebas |
| `hex` | ya | perkiraan visual, bukan kode warna resmi — dinyatakan di UI |
| `rilis_at` | tidak | untuk warna yang menyusul belakangan |
| `catatan` | tidak | mis. "eksklusif Apple Store" |

**Warna tidak pernah memengaruhi harga.** Kolom selisih harga sengaja tidak
ada dan jangan ditambahkan. Yang menggerakkan harga adalah kapasitas.

---

## 3. Yang TIDAK boleh diisi lewat migrasi

- `price_observations`, `service_observations`, `component_observations`
- `laporan_harga`, `diskusi`, `sentimen_harga`, `penilaian_laporan`
- `reputasi`

Semuanya data pasar atau kiriman orang. Mengisinya lewat migrasi berarti
angka karangan masuk lewat pintu yang paling dipercaya sistem. Untuk
kebutuhan peragaan, pakai `supabase/demo/` yang terpisah dan tidak pernah
ikut `db reset` produksi.

---

## 4. Daftar periksa satu produk baru

1. Baris `products` lengkap sampai `bentuk.siluet`
2. `penerus_id` produk generasi sebelumnya diarahkan ke produk ini
3. Warna resmi dimasukkan ke `product_colors`
4. `harga_rilis_id` + `harga_rilis_global` + `kurs_rilis`, atau ketiganya
   dikosongkan sekalian — jangan setengah
5. Kalau kategorinya `iphone`, zona hotspot diwarisi dari generasi terdekat
   yang bentuk fisiknya sama
6. Cek halaman `/p/<slug>` benar-benar terbuka dan ilustrasinya bukan siluet
   generik

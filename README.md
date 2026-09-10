# hargaapel

Situs publik pembanding harga perangkat Apple, harga jasa servis, dan nilai
komponen bekas, untuk pembaca di Jakarta dan sekitarnya.

## Menjalankan

```bash
npm install
npx supabase start      # stack lokal (Postgres, Auth, Storage)
npx supabase db reset   # jalankan migrasi + seed
npm run dev
```

Salin `.env.example` jadi `.env.local` dan isi kredensial Supabase lokal
(dicetak oleh `supabase start`). Buka [http://localhost:3000](http://localhost:3000).

Sebelum menjalankan di produksi, kerjakan bagian A di catatan setup internal:
Supabase (wajib sebelum mulai), SMTP kustom (wajib sebelum ada pengguna asli),
dan backup (wajib sebelum ada data yang sayang hilang).

## Enam keputusan yang menentukan segalanya

Kalau ragu saat mengubah sesuatu, kembali ke sini.

1. **Tabel observasi append-only.** Harga tidak pernah di-update. Kalau harga
   ditimpa, tiga bulan lagi tidak ada riwayat, dan riwayat itu satu-satunya hal
   di proyek ini yang tidak bisa dibangun ulang dari sumber mana pun.

2. **Yang sebanding saja yang dibandingkan.** Unit inter bukan unit resmi. Sisi
   jual bukan sisi beli. Grade part berbeda bukan barang yang sama. Mencampurnya
   membuat seluruh angka bohong dengan cara yang tidak kelihatan.

3. **Harga jasa servis tidak diturunkan dari harga unit; nilai komponen bekas
   memang diturunkan dari harga unit.** Dua hal berbeda. Yang pertama digerakkan
   biaya part dan tenaga. Yang kedua adalah pecahan dari nilai unit, karena unit
   bekas memang jumlah dari part-partnya.

4. **Yang ditampilkan adalah harga terpantau, bukan harga yang dianjurkan.** Ini
   menentukan apakah situs ini sumber informasi atau alat penyeragaman harga.
   Semua kalimat vonis ditujukan ke pembeli tentang apa yang perlu ditanyakan.

5. **Penjual hasil pencatatan manual tidak disebut namanya.** Yang menggantikan
   nama sebagai penanda kredibilitas adalah jumlah penjual dan kapan terakhir
   dicek. Keduanya wajib tampil di setiap angka agregat.

6. **Iklan boleh di sekitar data, tidak pernah di dalamnya.** Seluruh nilai situs
   ini bertumpu pada angkanya tidak dibeli. Begitu satu toko bisa membayar untuk
   terlihat lebih murah, tidak ada lagi yang layak dijual ke pengiklan.

## Yang sengaja tidak dibangun

Marketplace, checkout, keranjang, akun untuk pembaca, chat penjual-pembeli,
scraper Tokopedia dan Shopee, model machine learning untuk prediksi harga,
provider WhatsApp berbasis sesi atau QR.

## Yang belum ada dan hanya bisa diisi dari data nyata

Angka harga servis dan harga komponen sengaja dikosongkan di seed. Tidak ada
sumber online untuk memverifikasinya, jadi angka karangan tidak akan pernah
ketahuan salahnya dan diam-diam menjadi dasar seluruh vonis. Situs menampilkan
"belum ada data" sampai ada penjual nyata tercatat, dan itu keadaan yang benar.

Foto grade — mulus, standar, ekonomis, sudut sama — juga hanya bisa datang dari
kontributor nyata. Pertanyaan "sebenarnya mulus itu seperti apa" adalah jurang
informasi terbesar di pasar HP bekas, dan belum ada yang menjawabnya dengan gambar.

# hargaapel — prompt tunggal

Taruh **empat** file ini di root repo kosong sebelum mulai:

- `hargaapel-SPEC.md` — spec dasar (skema device, pasaran.ts, sinyal.ts, scraper)
- `hargaapel-SERVIS.md` — adendum servis
- `hargaapel-SETUP.md` — kredensial dan aturan keamanan
- `harga-apel.jsx` — mockup UI

Lalu `git init`, jalankan `claude`, paste seluruh blok di bawah sekali jalan.

Ada dua titik berhenti di dalamnya. Itu bukan fase yang harus di-paste ulang —
Claude Code berhenti sendiri, menunjukkan hasilnya, dan lanjut begitu kamu bilang
lanjut. Dua titik itu ada karena keduanya mahal kalau salah dan baru ketahuan
belakangan: skema tidak bisa diubah murah setelah ada data, dan salinan teks
vonis adalah permukaan yang menentukan situs ini jadi sumber informasi atau alat
penyeragaman harga.

---

```
Baca hargaapel-SPEC.md, hargaapel-SERVIS.md, dan hargaapel-SETUP.md sampai habis
sebelum menulis kode apa pun. Kalau ada yang bertabrakan: SETUP.md menang untuk
hal kredensial dan keamanan, SERVIS.md menang untuk hal servis, SPEC.md menang
untuk sisanya.

Bangun hargaapel: situs publik pembanding harga produk Apple DAN harga servis
Apple untuk Jabodetabek. Kerjakan seluruhnya dalam sesi ini, berurutan, tanpa
menunggu instruksi tambahan kecuali di dua titik berhenti yang saya sebut di
bawah.

Datanya datang dari tiga arah: feed JSON toko yang jalan di Shopify, pencatatan
manual harga unit dari HP di kios ITC Roxy Mas, dan pencatatan manual harga
servis dari bengkel. Yang ketiga tidak punya sumber online sama sekali dan itu
justru inti nilainya.

Di repo ada harga-apel.jsx, mockup UI satu file. Pakai sebagai acuan tampilan,
pengelompokan, dan bahasa Indonesia yang dipakai. Jangan disalin mentah. Mockup
itu dibuat sebelum konsep sisi beli, grading, dan servis ada, jadi tampilannya
belum menampilkan ketiganya. SPEC dan SERVIS yang menang kalau berbeda.

== ATURAN YANG TIDAK BOLEH DILANGGAR DI SELURUH PEKERJAAN ==

1. price_observations dan service_observations append-only. Harga tidak pernah
   di-UPDATE. Koreksi ditulis sebagai baris baru yang mengisi koreksi_atas.
2. Unit inter dan unit garansi resmi tidak pernah satu grup. Sisi jual dan sisi
   beli tidak pernah satu median. Grade part berbeda tidak pernah satu median.
   Harga all-in dan harga part-saja tidak pernah satu median.
3. Harga servis TIDAK PERNAH dihitung dari harga device. Satu-satunya hubungan
   antara keduanya adalah rasio kelayakan perbaikan di SERVIS.md aturan 2.
4. Tidak ada machine learning di mana pun. Semua vonis dan sinyal rule-based,
   dan wajib bisa menjelaskan dasarnya dalam satu kalimat.
5. Rentang harga dari sumber online adalah referensi, bukan batas. Data manual
   di luar rentang ditandai perlu_verifikasi, tetap ditampilkan, tidak dijepit
   dan tidak disembunyikan.
6. Tidak ada domain sumber yang hardcoded di kode. Semua di tabel sources.
7. Aturan bahasa SERVIS.md bagian 4 berlaku di seluruh UI, termasuk halaman
   device: tampilkan harga yang terpantau, jangan pernah harga yang dianjurkan.
   Semua kalimat vonis ditujukan ke pembeli tentang apa yang perlu ditanyakan,
   tidak pernah ke penjual tentang bagaimana ia harus memasang harga. Kata
   "prediksi", "ramalan", "dijamin", "standar harga", "patokan", "kiblat",
   "harga resmi" tidak boleh muncul di UI.
8. Setiap fungsi perhitungan harga adalah fungsi murni di src/lib, tanpa akses
   database, dan punya test vitest. Klien tidak pernah punya logika harga.
9. TIDAK ADA login wall. Seluruh halaman publik terbaca penuh tanpa akun, tanpa
   modal, tanpa interstitial, tanpa hitungan artikel gratis. Login hanya
   membuka fitur tambahan, tidak pernah membuka isi yang sudah ada.
10. Tidak ada satu pun rahasia yang ditulis di dalam kode. Semua lewat env sesuai
    SETUP.md. Variabel berawalan NEXT_PUBLIC_ terlihat browser, jadi hanya untuk
    nilai yang memang publik. SUPABASE_SERVICE_ROLE_KEY tidak pernah diberi
    awalan itu dan tidak pernah diimpor di file yang punya "use client".
11. Tidak memakai provider WhatsApp berbasis sesi atau QR (Whapi, Wablas, Fonnte,
    dan sejenisnya). Kalau butuh kirim WA otomatis, hanya Meta Cloud API resmi,
    dan itu pun digembok sampai BAGIAN 11.

== URUTAN KERJA ==

BAGIAN 1 — fondasi
- Scaffold Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase.
- Migrasi 001 sampai 004 sesuai skema SPEC.md, plus 010_servis.sql sesuai
  SERVIS.md, plus view sebaran_servis.
- RLS: select publik untuk products, sellers, workshops, price_observations,
  service_observations, service_types, part_grades, market_events, fx_rates.
  sources, source_product_map, scrape_runs TIDAK publik. Update dan delete pada
  kedua tabel observasi ditolak eksplisit untuk semua role selain service role.
- Seed: 10 produk Apple, penjual awal termasuk satu bertipe buyback, seluruh
  service_types dan part_grades sesuai daftar di SERVIS.md dengan kolom
  penjelasan terisi kalimat yang dimengerti orang awam.
- JANGAN seed angka harga servis. Kosongkan. Alasannya ada di akhir SERVIS.md.
- Tipe TypeScript digenerate dari Supabase, bukan ditulis tangan.

>>> BERHENTI 1. Jalankan migrasi, npm run build, tsc --noEmit. Tampilkan ringkasan
>>> skema akhir dalam bentuk tabel: nama tabel, kolom kunci, dan kunci grup
>>> pembanding untuk device dan untuk servis. Tunggu saya bilang lanjut.

BAGIAN 2 — logika harga, murni dan teruji
- src/lib/pasaran.ts: pengelompokan device. Kunci grup produk + kondisi + grade
  + garansi, hanya sisi jual. Buang grup di bawah 2 penjual. Buang observasi
  lebih dari 7 hari. Hitung median, min, max, delta, posisi. Vonis -6/+6 persen.
- src/lib/servis.ts: sebaran servis. Kunci grup produk + jenis_servis +
  grade_part, hanya termasuk_jasa true, jendela 120 hari. Gerbang 5 bengkel.
  Persentil p10 p25 p50 p75 p90. Vonis lima pita sesuai tabel SERVIS.md.
- src/lib/kelayakan.ts: rasio kelayakan. Sembunyikan kalau salah satu sisi
  datanya belum ada. Jangan pernah menebak.
- src/lib/sinyal.ts: mesin sinyal sesuai SPEC.md, urutan aturan persis, aturan 0
  adalah gerbang yang tidak boleh dilewati.
- Test vitest untuk keempatnya. Wajib termasuk kasus batas: grup satu toko,
  harga identik semua, satu outlier ekstrem, jumlah genap dan ganjil, semua data
  kedaluwarsa, tepat 5 bengkel, tepat 4 bengkel, tepat 4 observasi sinyal, tren
  tepat -3 persen, dan kasus di mana observasi sisi beli ikut masuk (harus
  terbuang dari perhitungan sisi jual).
- Satu test khusus yang memindai seluruh string UI dan gagal kalau menemukan
  kata terlarang di aturan 7.

BAGIAN 3 — scraper
- src/lib/adapters/shopify.ts sesuai SPEC.md. Sebelum menulisnya, cek
  https://shop.maujual.com/products.json?limit=5 dan laporkan bentuk JSON-nya.
  Kalau diblokir atau bukan JSON, katakan, jangan diam-diam pindah ke HTML.
- src/lib/scrape/run.ts: gerbang kewarasan turun 30 persen berarti ditolak dan
  nol observasi ditulis; pencocokan lewat source_product_map, yang belum
  terpetakan disimpan dengan product_id null dan TIDAK PERNAH ditebak atau
  dicocokkan fuzzy; peredam duplikat harga sama dalam 20 jam; scrape_runs
  ditulis dari awal sampai akhir.
- POST /api/scrape/run dengan bearer token dari env SCRAPE_TOKEN, body
  { source_id } atau { semua: true }.
- Cron Vercel sesuai sources.cadence. Harian untuk adapter shopify.
- Test run.ts dengan adapter palsu untuk keempat kasus di atas.

BAGIAN 4 — UI publik device
- Halaman / sesuai mockup: sorotan selisih terbesar, filter sticky kategori,
  kondisi, grade, garansi, area, daftar grup dengan bar posisi.
- Baris hasil scrape mencantumkan nama sumber dan tautan ke halaman aslinya.
- Penanda kecil pada baris perlu_verifikasi.
- Server Component, tanpa client fetching.

BAGIAN 5 — UI publik servis
- /servis: pilih perangkat lalu jenis kerusakan.
- /servis/[produk]/[jenis]: sebaran per grade part sebagai bar p10 sampai p90,
  penjelasan tiap grade part diambil dari kolom penjelasan, rasio kelayakan
  kalau datanya ada, daftar bengkel.
- /cek-harga: tiga input, satu jawaban. Perangkat, kerusakan, harga yang
  ditawarkan. Keluarkan vonis beserta salinan teksnya persis seperti tertulis di
  SERVIS.md, bar sebaran dengan posisi harga ditandai, jumlah bengkel yang jadi
  dasar, kapan terakhir diperbarui, rasio kelayakan, dan daftar pertanyaan yang
  bisa dibacakan langsung ke tukang servis sesuai jenis servisnya.
- Kalau bengkel kurang dari 5, tampilkan daftar harga apa adanya tanpa vonis dan
  tanpa label. Jangan tampilkan pita kosong.
- /cek-harga harus enak dipakai satu tangan, di dalam mal, sinyal jelek, sambil
  ada orang menunggu jawaban. Uji lebar 360px.

>>> BERHENTI 2. Tampilkan ke saya seluruh salinan teks vonis yang benar-benar
>>> dirender, device maupun servis, apa adanya. Sertakan daftar pertanyaan
>>> per jenis servis. Tunggu saya bilang lanjut.

BAGIAN 6 — pencatatan dari HP
- /catat untuk device dan /catat/servis untuk servis. Keduanya: satu layar tanpa
  scroll, toko atau bengkel terakhir diingat di localStorage dan terisi otomatis,
  daftar tombol besar diurutkan berdasarkan frekuensi pencatatan 30 hari terakhir
  bukan alfabetis, chip untuk kondisi grade garansi, harga inputMode numeric
  dengan format ribuan otomatis, offline queue di localStorage dengan jumlah
  antrean terlihat, optimistic update.
- Setelah simpan tampilkan posisi harga barusan terhadap sebaran. Selisih di atas
  25 persen minta konfirmasi sekali sebelum menyimpan.
- /catat/servis tambahan: toggle all-in, toggle no fix no pay, isian garansi hari.
- Auth Supabase magic link, hanya kontributor.

BAGIAN 7 — riwayat dan realtime
- Cron refresh pasaran_harian dan sebaran_servis concurrently.
- ambilSeri dengan forward fill, sparkline SVG tanpa library chart, perubahan 30
  hari, titik kesegaran hijau kuning abu.
- Realtime satu channel pada kedua tabel observasi. Highlight baris 2 detik
  sekali saja, hormati prefers-reduced-motion. Koneksi putus berarti diam dan
  sambung ulang, bukan error.

BAGIAN 8 — sisi beli dan sinyal
- Sumber buyback dengan sisi beli. Kalau harganya ternyata butuh submit form
  kuesioner, berhenti dan laporkan sebelum menulis kode.
- Baris bid-ask pada grup barang second dengan label eksplisit.
- Peringatan lantai pasar di /catat, peringatan bukan blokir.
- market_events dan fx_rates, sinyal dihitung server-side ke sinyal_cache.

BAGIAN 9 — akun, alert, dan saluran WhatsApp

Baca ulang aturan keras nomor 9 sebelum mulai. Akun di sini menambah kemampuan,
tidak pernah mengunci isi.

Migrasi 020_akun.sql:
- profiles: id references auth.users on delete cascade, nama, wa_e164 text,
  wa_terverifikasi boolean default false, peran text check in
  ('member','kontributor','admin') default 'member', created_at.
- watchlists: id, user_id, jenis text check in ('device','servis'),
  product_id, kondisi, grade, garansi, service_type_id, part_grade_id,
  target_harga bigint, kanal text check in ('email','wa') default 'email',
  aktif boolean default true, created_at. Maksimal 20 baris aktif per user,
  ditegakkan lewat trigger, bukan hanya di UI.
- alert_deliveries: id, watchlist_id, harga_pemicu, kanal, status, dikirim_at.
  Sebelum mengirim, cek tabel ini: satu watchlist tidak boleh memicu dua kali
  untuk harga yang sama dalam 7 hari.
- wa_broadcast_drafts: id, judul, isi text, periode_mulai, periode_selesai,
  status text check in ('draft','disalin'), created_at.

RLS untuk ketiganya: user hanya bisa select dan update barisnya sendiri.
profiles.wa_e164 adalah data pribadi — tidak boleh terbaca anon, tidak boleh
muncul di response API mana pun selain milik user itu sendiri.

Auth:
- Supabase Auth magic link email. SMTP kustom sesuai SETUP.md, bukan SMTP bawaan
  Supabase yang dibatasi ketat dan akan gagal diam-diam di produksi.
- Halaman /masuk sederhana: satu input email, satu tombol. Turnstile di depannya.
- Rate limit per IP dan per email di route handler, jangan hanya andalkan
  Supabase.
- Peran diambil dari profiles.peran, dicek di server, tidak pernah dari klien.
  Middleware melindungi /catat, /catat/servis, /admin.
- Nomor WA diisi opsional di /akun. Belum ada verifikasi OTP di fase ini —
  simpan apa adanya dengan penanda wa_terverifikasi false, dan jangan pernah
  memakai nomor yang belum terverifikasi untuk apa pun selain ditampilkan ke
  pemiliknya sendiri.

Ajakan daftar, dan hanya di tiga tempat ini:
- Di bawah hasil /cek-harga, setelah jawabannya sudah terlihat penuh:
  "Mau dikabari kalau harga ini turun?"
- Di halaman produk, tombol kecil "pantau harga ini".
- Di footer.
Tidak ada modal. Tidak ada popup. Tidak ada overlay yang menutupi harga.
Tidak ada exit intent. Tidak ada hitungan mundur.

Alert:
- Cron harian mengevaluasi watchlists terhadap pasaran terbaru.
- Kanal email dikirim lewat provider di SETUP.md.
- Kanal wa TIDAK dikirim otomatis di fase ini. Alert WA yang jatuh tempo masuk
  ke halaman /admin/kirim sebagai daftar dengan teks pesan yang sudah jadi dan
  tombol salin per baris. Saya yang mengirim manual.

Saluran WhatsApp:
- Tombol "ikuti saluran WhatsApp" di footer dan di bawah /cek-harga, mengarah ke
  NEXT_PUBLIC_WA_CHANNEL_URL. Kalau env itu kosong, tombolnya tidak dirender
  sama sekali, bukan mengarah ke tautan mati.
- /admin/siaran: tombol yang menyusun draf rekap mingguan dari data nyata —
  lima selisih terbesar minggu itu, harga yang paling banyak berubah, dan
  jumlah harga baru yang masuk. Simpan ke wa_broadcast_drafts, tampilkan
  sebagai teks siap salin. Saya yang menempel dan mengirim di aplikasi WhatsApp.
- Jangan menulis integrasi pengiriman otomatis ke saluran. Tidak ada API resmi
  untuk itu dan yang tidak resmi berisiko akun diblokir.

BAGIAN 10 — penutup
- /admin/sumber: daftar sumber, tombol jalankan sekarang, 20 run terakhir,
  antrean source_product_map yang belum dipetakan dengan dropdown pemetaan.
- /p/[slug] dan /servis/[produk]/[jenis] dengan grafik dua seri.
- OG image dinamis, sitemap, robots.
- .env.example lengkap sesuai SETUP.md dengan seluruh nilai dikosongkan, plus
  .gitignore yang menutup .env*.local. Jalankan pemeriksaan akhir: pastikan
  tidak ada satu pun kunci asli yang pernah masuk git.
- Footer: bukan saran keuangan, harga bisa berubah, harga yang ditampilkan
  adalah yang terpantau bukan yang dianjurkan.

BAGIAN 11 — DIGEMBOK, jangan dikerjakan sekarang

Pengiriman WhatsApp otomatis lewat Meta Cloud API resmi. Butuh WhatsApp Business
Account, verifikasi bisnis, dan template yang disetujui Meta.

Kalau saya memintanya di sesi ini, tanya balik dulu: apakah sudah ada minimal 50
orang yang mendaftar alert dan apakah mengirim manual sudah terasa memberatkan?
Kalau belum, tolak dan ingatkan saya. Mengirim 50 pesan manual seminggu sekali
itu 20 menit. Membangun integrasi ini beberapa hari, ditambah verifikasi bisnis
yang di luar kendali kita.

== CARA KERJA YANG SAYA HARAPKAN ==

Setelah tiap bagian, jalankan npm run build, tsc --noEmit, dan vitest, lalu tulis
satu paragraf pendek: apa yang selesai, apa yang kamu putuskan sendiri karena
SPEC tidak menyebutkan, dan apa yang menurutmu akan jadi masalah nanti. Baru
lanjut bagian berikutnya. Jangan menunggu saya kecuali di dua titik BERHENTI.

Kalau ada yang benar-benar tidak jelas dan tebakannya mahal untuk dibatalkan,
berhenti dan tanya. Kalau tebakannya murah dibatalkan, ambil keputusan, catat di
paragraf, dan jalan terus.

Jangan menambah fitur yang tidak ada di daftar. Jangan bangun scraper Tokopedia
atau Shopee. Jangan bangun checkout, keranjang, akun pengunjung, atau chat.
```

---

## Kalau di tengah jalan melebar

```
Berhenti. Cek ulang ke SPEC.md dan SERVIS.md. Apakah yang kamu bangun ada di
daftar bagian, atau kamu menambah sendiri? Kalau menambah sendiri, batalkan.
```

## Kalau menyentuh harga

```
Apakah perubahan ini melakukan UPDATE pada kolom harga di price_observations
atau service_observations? Kalau iya, batalkan. Kedua tabel itu append-only.
```

## Kalau mulai mencampur

```
Cek satu per satu: apakah perhitungan ini menggabungkan sisi jual dengan sisi
beli, grade part yang berbeda, atau harga all-in dengan harga part-saja, dalam
satu median? Kalau salah satu iya, pisahkan.
```

## Kalau harga servis mulai diturunkan dari harga device

```
Apakah ada tempat di kode ini yang menghitung harga servis sebagai fungsi dari
harga jual unit? Kalau ada, hapus. Satu-satunya hubungan yang sah antara kedua
dataset adalah rasio kelayakan di SERVIS.md aturan 2, dan arahnya adalah harga
servis dibagi harga unit, bukan sebaliknya.
```

## Kalau bahasa vonis mulai menghakimi penjual

```
Baca ulang aturan bahasa di SERVIS.md bagian 4. Setiap kalimat vonis harus
ditujukan ke pembeli tentang apa yang perlu ditanyakan, tidak pernah ke penjual
tentang bagaimana ia harus memasang harga. Perbaiki semua yang melanggar.
```

## Kalau mulai bikin login wall

```
Baca ulang aturan keras nomor 9. Apakah ada halaman publik yang jadi tidak
terbaca penuh tanpa akun, atau ada modal/overlay/popup yang menutupi harga?
Kalau ada, hapus. Akun hanya menambah fitur, tidak pernah mengunci isi.
```

## Kalau menyentuh kredensial

```
Cek tiga hal: (1) apakah ada nilai rahasia yang ditulis langsung di kode,
(2) apakah ada rahasia yang diberi awalan NEXT_PUBLIC_, (3) apakah
SUPABASE_SERVICE_ROLE_KEY diimpor di file mana pun yang punya "use client"
atau yang bisa sampai ke bundle browser. Kalau salah satu iya, perbaiki
sekarang sebelum lanjut.
```

## Kalau mulai integrasi WhatsApp otomatis

```
Apakah ini memakai Meta Cloud API resmi, atau provider berbasis sesi/QR?
Kalau berbasis sesi, batalkan — itu melanggar aturan keras nomor 11. Kalau
Cloud API resmi, itu BAGIAN 11 yang digembok; tanya saya dulu sesuai
instruksinya.
```

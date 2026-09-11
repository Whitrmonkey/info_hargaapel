# Data peragaan

Isi folder ini **bukan data pasar**. Angkanya dibuat supaya prototipe bisa
dilihat orang, bukan untuk dipercaya.

Karena itu ia sengaja ada di luar `supabase/migrations/`:

- `db reset` TIDAK memuatnya
- deploy produksi TIDAK memuatnya
- tidak ada jalur mana pun yang memuatnya tanpa seseorang mengetik perintahnya

Memuatnya:

```bash
docker exec -i supabase_db_abc psql -U postgres -d postgres < supabase/demo/isi.sql
```

Mengosongkannya kembali:

```bash
docker exec -i supabase_db_abc psql -U postgres -d postgres < supabase/demo/kosongkan.sql
```

Kenapa dipisah sekeras ini: seluruh nilai situs ini bertumpu pada angkanya
tidak dikarang. Begitu data peragaan bisa ikut terbawa ke basis data nyata
lewat jalur yang sama dengan migrasi, tidak ada lagi yang bisa memastikan
angka mana yang terpantau dan angka mana yang dibuat untuk demo.

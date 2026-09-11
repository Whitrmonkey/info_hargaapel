#!/usr/bin/env bash
# Membuat repo GitHub privat dan mendorong seluruh riwayat ke sana.
#
# Jalankan SETELAH `gh auth login` sekali. Aman diulang: kalau repo-nya
# sudah ada, ia cuma menambahkan remote dan mendorong.
set -euo pipefail

NAMA="${1:-hargaapel}"

if ! gh auth status >/dev/null 2>&1; then
  echo "Belum login. Jalankan dulu:  gh auth login"
  exit 1
fi

# Penjaga terakhir: jangan pernah mendorong kalau ada berkas env terlacak.
if git ls-files | grep -qE '^\.env($|\.)' && ! git ls-files | grep -qx '.env.example'; then
  echo "BERHENTI: ada berkas .env yang terlacak git."
  exit 1
fi
if git ls-files | grep -qx '.env.local'; then
  echo "BERHENTI: .env.local terlacak git. Keluarkan dulu sebelum didorong."
  exit 1
fi

if git remote | grep -qx origin; then
  echo "Remote origin sudah ada: $(git remote get-url origin)"
else
  gh repo create "$NAMA" --private --source=. --remote=origin
fi

git push -u origin main
echo
echo "Selesai. Selanjutnya:"
echo "  1. Buat proyek Supabase, lalu: npx supabase link --project-ref <ref> && npx supabase db push"
echo "  2. Import repo ini di https://vercel.com/new"
echo "  3. Isi env sesuai docs/DEPLOY.md (empat yang wajib + NEXT_PUBLIC_MODE_DATA=maintenance)"

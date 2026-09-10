// Kalau env kosong, tombolnya tidak dirender sama sekali -- bukan mengarah
// ke tautan mati (SPEC.md BAGIAN 9).
export function TombolSaluranWa() {
  const url = process.env.NEXT_PUBLIC_WA_CHANNEL_URL;
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
      Ikuti saluran WhatsApp
    </a>
  );
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const BUTUH_KONTRIBUTOR = ["/catat", "/catat/servis"];
const BUTUH_ADMIN_PREFIX = "/admin";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { pathname } = request.nextUrl;
  const perluKontributor = BUTUH_KONTRIBUTOR.includes(pathname);
  const perluAdmin = pathname.startsWith(BUTUH_ADMIN_PREFIX);
  if (!perluKontributor && !perluAdmin) return response;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/masuk?lanjut=${encodeURIComponent(pathname)}`, request.url));
  }

  // Peran dicek dari profiles di server, tidak pernah dipercaya dari klien.
  const { data: profil } = await supabase.from("profiles").select("peran").eq("id", user.id).single();
  const peran = profil?.peran ?? "member";
  const diizinkan = perluAdmin ? peran === "admin" : peran === "kontributor" || peran === "admin";

  if (!diizinkan) return NextResponse.redirect(new URL("/", request.url));

  return response;
}

export const config = {
  matcher: ["/catat", "/catat/servis", "/admin/:path*"],
};

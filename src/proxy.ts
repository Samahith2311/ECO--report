import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Guards /admin/*: only a signed-in user whose JWT has app_metadata.role = 'admin' gets in.
// getClaims() verifies the JWT (a plain cookie read can be forged) and refreshes the
// session cookies when the access token is about to expire.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isAdmin = data?.claims.app_metadata?.role === "admin";
  const onLoginPage = request.nextUrl.pathname === "/admin/login";

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c)); // keep refreshed session cookies
    return redirect;
  };

  if (!isAdmin && !onLoginPage) return redirectTo("/admin/login");
  if (isAdmin && onLoginPage) return redirectTo("/admin");
  return response;
}

export const config = { matcher: "/admin/:path*" };

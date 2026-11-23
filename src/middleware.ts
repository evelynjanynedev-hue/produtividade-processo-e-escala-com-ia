import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se o usuário não tem sessão nem está indo para /login ou /cadastro, redireciona
  if (!pathname.startsWith("/login") && !pathname.startsWith("/cadastro")) {
    const hasSession = request.cookies?.get("sx_session")?.value;
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirectTo", pathname);
      return Response.redirect(url, 302);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
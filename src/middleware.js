import { NextResponse } from "next/server";

export function middleware(request) {
  // 1. Cek apakah user mau masuk ke halaman "/admin"
  if (request.nextUrl.pathname.startsWith("/admin")) {
    
    // 2. Cek apakah dia punya cookie "admin_session"
    const adminSession = request.cookies.get("admin_session");

    // 3. Jika TIDAK punya cookie, tendang ke halaman login
    if (!adminSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Jika aman, silakan lanjut
  return NextResponse.next();
}

// Konfigurasi: Middleware ini hanya aktif di rute "/admin"
export const config = {
  matcher: "/admin/:path*",
};
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    // Cek apakah password sesuai
    if (password === process.env.ADMIN_PASSWORD) {
      
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 Hari
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    // --- FITUR ANTI-BRUTE FORCE (RATE LIMIT SEDERHANA) ---
    // Jika password SALAH, kita tahan dulu prosesnya selama 2 detik (2000ms)
    // Ini membuat hacker sangat lambat jika ingin menebak password
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // ------------------------------------------------------

    return NextResponse.json({ success: false, error: "Password Salah!" }, { status: 401 });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (data.success) {
      // Jika sukses, pindah ke Admin
      router.push("/admin");
      router.refresh(); // Refresh agar middleware mengizinkan
    } else {
      setError("Password Salah! Jangan iseng ya.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
        <h1 className="text-2xl font-bold text-cyan-400 mb-2 text-center">Admin Access</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Masukkan password untuk mengelola data Chaos Zero Nightmare.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Admin Password"
              className="w-full p-3 bg-black/50 border border-slate-700 rounded focus:border-cyan-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded font-bold shadow-lg shadow-cyan-500/20 transition-all"
          >
            LOGIN
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <a href="/" className="text-xs text-slate-500 hover:text-white underline">Kembali ke Home</a>
        </div>
      </div>
    </main>
  );
}
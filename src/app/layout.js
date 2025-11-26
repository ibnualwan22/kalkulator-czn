// src/app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Chaos Zero Nightmare Calculator",
  description: "Calculate Faint Memory for your Chaos Zero Nightmare team.",
  manifest: "/manifest.json",
};

// 2. Viewport & Theme Color (Dipisah ke sini agar tidak warning)
export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah zoom cubit (biar rasa app native)
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen flex flex-col`}>
        
        {/* KONTEN UTAMA */}
        <div className="flex-1 relative z-10">
          {children}
        </div>

        {/* FOOTER */}
        <footer className="bg-slate-900 border-t border-slate-800 py-8 relative z-50 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            
            {/* Bagian 1: Developer Profile */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-slate-400 text-sm">Developed by</span>
              <a 
                href="https://www.facebook.com/Ibnu.alwannn/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-blue-500/20"
              >
                {/* Ikon Facebook SVG */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Ibnu Alwan
              </a>
            </div>

            {/* Bagian 2: Community Link */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-xs text-slate-500 mb-4">
              <span>Proud Member of</span>
              <a 
                href="https://www.facebook.com/groups/937636558309618" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-300 hover:text-cyan-400 transition-colors border-b border-transparent hover:border-cyan-400 pb-0.5"
              >
                 {/* Ikon Group (Users) SVG */}
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                 Chaos Zero Nightmare Indonesia
              </a>
            </div>

            {/* Disclaimer */}
            <div className="text-[10px] text-slate-700 border-t border-slate-800 pt-4 w-1/2 mx-auto">
              &copy; {new Date().getFullYear()} CZN Fan Tools. All rights reserved. This tool is unofficial and not affiliated with or endorsed by the original game developers.
            </div>
            
          </div>
        </footer>

      </body>
    </html>
  );
}
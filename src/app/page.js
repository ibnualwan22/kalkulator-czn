// src/app/page.js
"use client"; // Wajib untuk komponen interaktif
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <--- 1. TAMBAH INI

export default function Home() {
  const router = useRouter(); // <--- 2. TAMBAH INI
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState([]);

  // 1. Ambil data dari API saat web dibuka
  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/initial-data");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Fungsi memilih combatant (Max 3)
  const toggleCombatant = (combatant) => {
    if (selectedTeam.find((c) => c.id === combatant.id)) {
      // Kalau sudah ada, hapus (deselect)
      setSelectedTeam(selectedTeam.filter((c) => c.id !== combatant.id));
    } else {
      // Kalau belum ada, tambah (max 3)
      if (selectedTeam.length < 3) {
        setSelectedTeam([...selectedTeam, combatant]);
      } else {
        alert("Tim sudah penuh (Maksimal 3)!");
      }
    }
  };
  const handleStart = () => {
    // Ambil ID dari tim yang dipilih, misal: [1, 2]
    const ids = selectedTeam.map((c) => c.id).join(",");
    // Pindah ke halaman /calculator dengan membawa data ID
    router.push(`/calculator?ids=${ids}`);
  };

  if (loading) return <div className="p-10 text-white">Loading System...</div>;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-2 text-purple-400">
        Chaos Zero Nightmare <span className="text-white text-lg">Calculator</span>
      </h1>
      <p className="text-slate-400 mb-8">Pilih Combatant dan racik deck impianmu</p>

      {/* PILIH KARAKTER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {data?.combatants.map((char) => {
          const isSelected = selectedTeam.find((c) => c.id === char.id);
          return (
            <div
              key={char.id}
              onClick={() => toggleCombatant(char)}
              // Styling container utama kartu
              className={`relative group cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all aspect-[3/4] 
                ${isSelected
                  ? "border-4 border-purple-500 scale-105" // Lebih tebal dan sedikit membesar jika terpilih
                  : "border-2 border-slate-700 hover:border-slate-500"
                }`
              }
            >
              {/* LAYER 1: GAMBAR BACKGROUND KARAKTER */}
              {char.imageUrl ? (
                <img 
                  src={char.imageUrl} 
                  alt={char.name} 
                  className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-300 group-hover:scale-105" 
                />
              ) : (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-xs text-slate-500 z-0">
                  No Image
                </div>
              )}

              {/* LAYER 2: GRADIENT HITAM (Untuk membuat teks terbaca di bagian bawah) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10"></div>

              {/* LAYER 3: TEKS OVERLAY */}
              <div className="relative z-20 flex flex-col justify-end h-full p-4">
                <h3 className="font-bold text-xl leading-tight text-white drop-shadow-lg">
                  {char.name}
                </h3>
                <p className="text-xs text-slate-300 drop-shadow">
                  {char.cards.length} Default Cards
                </p>
              </div>

              {/* OVERLAY PILIH/TERPILIH */}
              {isSelected && (
                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center z-30">
                  <span className="text-white text-4xl font-extrabold drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TIM TERPILIH (PREVIEW) */}
      {selectedTeam.length > 0 && (
        <div className="border-t border-slate-700 pt-6">
          <h2 className="text-xl font-bold mb-4">Tim Kamu ({selectedTeam.length}/3)</h2>
          <div className="flex gap-4">
            {selectedTeam.map((char) => (
              <div key={char.id} className="bg-slate-800 p-3 rounded border border-slate-600">
                {char.name}
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleStart} // <--- Pasang fungsi di sini
            className="mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded shadow-lg shadow-purple-500/20"
          >
            Mulai Kalkulasi ({selectedTeam.length} Karakter) -&gt;
          </button>
        </div>
      )}
    </main>
  );
}
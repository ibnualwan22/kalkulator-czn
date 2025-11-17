// src/app/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/initial-data");
      const result = await res.json();
      if (result.success) {
        setData(result.data.combatants);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const toggleCombatant = (combatant) => {
    if (selectedTeam.find((c) => c.id === combatant.id)) {
      setSelectedTeam(selectedTeam.filter((c) => c.id !== combatant.id));
    } else {
      if (selectedTeam.length < 3) {
        setSelectedTeam([...selectedTeam, combatant]);
      } else {
        alert("Tim sudah penuh (Maksimal 3)!");
      }
    }
  };
  
  const handleStart = () => {
    const ids = selectedTeam.map((c) => c.id).join(",");
    router.push(`/calculator?ids=${ids}`);
  };

  if (loading) return <div className="p-10 text-white">Loading System...</div>;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 font-sans relative pb-32">
      {/* 1. Header */}
      <h1 className="text-3xl font-bold mb-2 text-cyan-400">
        Chaos Zero Nightmare <span className="text-white text-lg">Calculator</span>
      </h1>
      <p className="text-slate-400 mb-8">Pilih Combatant untuk memulai simulasi (Maks 3).</p>

      {/* 2. Grid Pemilihan Combatant */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data?.map((char) => {
          const isSelected = selectedTeam.find((c) => c.id === char.id);
          return (
            <div
              key={char.id}
              onClick={() => toggleCombatant(char)}
              className={`relative group cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all aspect-[3/4] 
                ${isSelected
                  ? "border-4 border-cyan-500 scale-105"
                  : "border-2 border-slate-700 hover:border-slate-500"
                }`
              }
            >
              {char.imageUrl ? (
                <img src={char.imageUrl} alt={char.name} className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-xs text-slate-500 z-0">No Image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10"></div>
              <div className="relative z-20 flex flex-col justify-end h-full p-4">
                <h3 className="font-bold text-xl leading-tight text-white drop-shadow-lg">{char.name}</h3>
                <p className="text-xs text-slate-300 drop-shadow">{char.cards.length} Default Cards</p>
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center z-30">
                  <span className="text-white text-4xl font-extrabold drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. TOMBOL MELAYANG (FLOATING BUTTON) BARU */}
      {selectedTeam.length > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 
                     bg-slate-900/80 backdrop-blur-md 
                     border-t border-slate-700 
                     p-4 shadow-lg"
        >
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            {/* Kiri: Preview Tim */}
            <div>
              <h2 className="text-sm font-bold text-white">Tim Terpilih ({selectedTeam.length}/3)</h2>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedTeam.map((char) => (
                  <div key={char.id} className="bg-slate-700 p-1 rounded border border-slate-600 text-xs flex items-center gap-1">
                    <img src={char.imageUrl || '/placeholder.png'} className="w-5 h-5 rounded-full object-cover"/>
                    {char.name}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Kanan: Tombol Submit */}
            <button 
              onClick={handleStart} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-cyan-500/20 transition-all text-lg"
            >
              Mulai Kalkulasi &rarr;
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
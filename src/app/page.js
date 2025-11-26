// src/app/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState([]); // Init dengan array kosong
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState([]);
  
  // STATE BARU: Search & Modal
  const [searchQuery, setSearchQuery] = useState("");
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/initial-data");
      const result = await res.json();
      if (result.success) {
        // FITUR 1: SORTING ABJAD (A-Z)
        const sortedCombatants = result.data.combatants.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setData(sortedCombatants);
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

  // FITUR 2: LIVE SEARCH FILTER
  const filteredData = data.filter((char) => 
    char.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-10 text-white text-center">Loading System...</div>;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans relative pb-32">
      
      {/* HEADER & SEARCH */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h1 className="flex flex-col items-start gap-0 leading-none">
                    <span className="text-4xl font-black tracking-tight text-white uppercase">CHAOS</span>
                    <span className="text-4xl font-black tracking-tight uppercase">
                        <span className="text-orange-500">Z</span>
                        <span className="text-white">ERO</span>
                    </span>
                    <span className="text-4xl font-black tracking-tight text-white uppercase">NIGHTMARE</span>
                </h1>
                <p className="text-slate-400 text-sm">Pilih Combatant untuk memulai simulasi.</p>
            </div>
            
            {/* TOMBOL BUKA RUMUS */}
            <button 
                onClick={() => setShowRulesModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-600 hover:border-cyan-500 rounded text-sm font-bold transition-all"
            >
                <span className="text-cyan-400 text-xl">?</span>
                <span>Panduan Rumus</span>
            </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
                type="text" 
                placeholder="Cari nama combatant..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors text-white placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      {/* GRID COMBATANT */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredData.length > 0 ? (
            filteredData.map((char) => {
            const isSelected = selectedTeam.find((c) => c.id === char.id);
            return (
                <div
                key={char.id}
                onClick={() => toggleCombatant(char)}
                className={`relative group cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all aspect-[3/4] 
                    ${isSelected
                    ? "border-4 border-cyan-500 scale-105 shadow-cyan-500/20"
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
                <div className="relative z-20 flex flex-col justify-end h-full p-3 md:p-4">
                    <h3 className="font-bold text-sm md:text-xl leading-tight text-white drop-shadow-lg">{char.name}</h3>
                    <p className="text-[10px] md:text-xs text-slate-300 drop-shadow">{char.cards.length} Default Cards</p>
                </div>
                {isSelected && (
                    <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center z-30">
                    <span className="text-white text-4xl font-extrabold drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">✓</span>
                    </div>
                )}
                </div>
            );
            })
        ) : (
            <div className="col-span-full text-center py-10 text-slate-500">
                Tidak ditemukan combatant dengan nama "{searchQuery}"
            </div>
        )}
      </div>

      {/* FLOATING BUTTON (SUBMIT) */}
      {selectedTeam.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-700 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] animate-slide-up">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h2 className="text-xs md:text-sm font-bold text-white mb-1">Tim Terpilih ({selectedTeam.length}/3)</h2>
              <div className="flex flex-wrap gap-2">
                {selectedTeam.map((char) => (
                  <div key={char.id} className="bg-slate-700 px-2 py-1 rounded border border-slate-600 text-[10px] md:text-xs flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full overflow-hidden bg-black">
                        <img src={char.imageUrl || '/placeholder.png'} className="w-full h-full object-cover"/>
                    </div>
                    {char.name}
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleStart} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 md:py-3 px-6 rounded-lg shadow-lg shadow-cyan-500/20 transition-all text-sm md:text-lg"
            >
              Mulai &rarr;
            </button>
          </div>
        </div>
      )}

      {/* FITUR 3: MODAL PANDUAN RUMUS */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowRulesModal(false)}>
            <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white">📖 Panduan Perhitungan Faint Memory</h2>
                    <button onClick={() => setShowRulesModal(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                {/* Content Scrollable */}
                <div className="p-6 overflow-y-auto text-sm text-slate-300 space-y-6">
                    
                    {/* Section 1: Tier & Cap */}
                    <div>
                        <h3 className="text-cyan-400 font-bold mb-2 text-lg">1. Kapasitas & Tier</h3>
                        <p className="mb-2">Setiap Combatant memiliki batas maksimal (Cap) Faint Memory yang bergantung pada Chaos Tier yang dipilih.</p>
                        <ul className="list-disc list-inside bg-black/20 p-3 rounded border border-slate-700">
                            <li>Tier 1 Max: <strong>30 Poin</strong></li>
                            <li>Setiap kenaikan 1 Tier: <strong>+10 Poin</strong></li>
                            <li>Contoh: Tier 5 = 70 Poin, Tier 15 = 170 Poin.</li>
                        </ul>
                    </div>

                    {/* Section 2: Nilai Kartu */}
                    <div>
                        <h3 className="text-yellow-400 font-bold mb-2 text-lg">2. Nilai Dasar Kartu</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-800 p-2 rounded border border-slate-700 flex justify-between">
                                <span>Basic / Unique</span> <strong>0 Pts</strong>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700 flex justify-between">
                                <span>Neutral / Forbidden</span> <strong>20 Pts</strong>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700 flex justify-between">
                                <span>Monster</span> <strong>80 Pts</strong>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Biaya Aksi Global */}
                    <div>
                        <h3 className="text-red-400 font-bold mb-2 text-lg">3. Skala Biaya Aksi (Global)</h3>
                        <p className="mb-2">Setiap aksi <strong>Copy</strong> atau <strong>Remove</strong> akan meningkatkan biaya untuk aksi berikutnya (berlaku per karakter).</p>
                        <div className="flex justify-between bg-black/40 p-3 rounded font-mono text-xs md:text-sm">
                            <div className="text-center">Ke-1<br/><span className="text-white font-bold">0</span></div>
                            <div className="text-center text-slate-500">→</div>
                            <div className="text-center">Ke-2<br/><span className="text-white font-bold">10</span></div>
                            <div className="text-center text-slate-500">→</div>
                            <div className="text-center">Ke-3<br/><span className="text-white font-bold">30</span></div>
                            <div className="text-center text-slate-500">→</div>
                            <div className="text-center">Ke-4<br/><span className="text-white font-bold">50</span></div>
                            <div className="text-center text-slate-500">→</div>
                            <div className="text-center">Ke-5+<br/><span className="text-white font-bold">70</span></div>
                        </div>
                    </div>

                    {/* Section 4: Rumus Detail */}
                    <div className="space-y-4">
                        <h3 className="text-purple-400 font-bold mb-2 text-lg">4. Rumus Detail Aksi</h3>
                        
                        <div className="p-3 border-l-4 border-blue-500 bg-slate-800/50">
                            <strong className="block text-white mb-1">COPY (Salin Kartu)</strong>
                            <code>Biaya Aksi + Harga Dasar Kartu + Bonus Status</code>
                            <p className="text-xs mt-1 opacity-70">Contoh: Copy Monster Divine (Aksi ke-2) = 10 + 80 + 20 = 110 Poin.</p>
                        </div>

                        <div className="p-3 border-l-4 border-red-500 bg-slate-800/50">
                            <strong className="block text-white mb-1">REMOVE (Hapus Kartu)</strong>
                            <code>Biaya Aksi + Base Hapus - Refund Status</code>
                            <ul className="list-disc list-inside text-xs mt-1 opacity-80">
                                <li>Hapus Basic/Unique: Base Hapus = <strong>+20</strong></li>
                                <li>Hapus Neutral/Monster: Base Hapus = <strong>-Harga Kartu (Refund)</strong></li>
                            </ul>
                        </div>

                        <div className="p-3 border-l-4 border-purple-500 bg-slate-800/50">
                            <strong className="block text-white mb-1">CONVERT (Tukar Kartu)</strong>
                            <code>Biaya Convert (10) + Harga Kartu Baru - Refund Status Lama</code>
                            <p className="text-xs mt-1 opacity-70">Kartu hasil convert dianggap 'Neutral' namun jika dihapus base-nya diperlakukan refund.</p>
                        </div>
                    </div>

                    <div className="text-xs text-center text-slate-500 pt-4 border-t border-slate-700">
                        *Rumus ini mengacu pada Logic v4.2 yang telah disesuaikan.
                    </div>
                </div>
            </div>
        </div>
      )}

    </main>
  );
}
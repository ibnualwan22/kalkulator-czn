"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading Route...</div>}>
      <CalculatorLogic />
    </Suspense>
  );
}

function CalculatorLogic() {
  const searchParams = useSearchParams();
  const teamIds = searchParams.get("ids")?.split(",") || [];

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState({});
  const [miscCards, setMiscCards] = useState([]);
  const [chaosTier, setChaosTier] = useState(1);
  const [activeTeam, setActiveTeam] = useState([]);
  
  const [modalData, setModalData] = useState(null);
  const [addCardModal, setAddCardModal] = useState(null); 
  const [convertSelector, setConvertSelector] = useState(null); 

  useEffect(() => {
    async function initData() {
      try {
        const res = await fetch("/api/initial-data");
        const result = await res.json();
        
        if (result.success) {
          const ruleMap = {};
          result.data.rules.forEach((r) => (ruleMap[r.key] = r.value));
          setRules(ruleMap);
          setMiscCards(result.data.miscCards);

          const allCombatants = result.data.combatants;
          const selectedCombatants = allCombatants.filter((c) => 
            teamIds.includes(c.id.toString())
          );

          const initialTeamState = selectedCombatants.map((char) => ({
              id: char.id,
              info: char,
              liveCards: char.cards.map((card, index) => ({
                  ...card,
                  uniqueId: `${char.id}_start_${index}`,
                  currentTier: "Normal",
                  isStarting: true,
                  isCopy: false,
                  isConverted: false,
              })),
              faintMemory: 0,
              counters: { duplication: 0, removal_basic: 0, removal_neutral: 0 },
              historyLog: []
          }));
          setActiveTeam(initialTeamState);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    initData();
  }, []);

  // --- FUNGSI HELPER (LOGIKA BARU) ---
  const getRule = (key, defaultVal) => rules[key] !== undefined ? rules[key] : defaultVal;
  
  // Aturan Scaling Biaya
  // Aturan Scaling Biaya (FIXED)
  const getScalingCost = (count, type) => {
    const neutralRemoveScale = [0, 10, 30, 50, 70]; // Aturan 2
    const basicRemoveScale = [20, 30, 50, 70];   // Aturan 1
    const universalCopyScale = [0, 10, 30, 50, 70]; // Klarifikasi Anda: SEMUA COPY SAMA

    switch (type) {
      case 'neutral_remove':
        return count < neutralRemoveScale.length ? neutralRemoveScale[count] : 70;
      case 'basic_remove':
        return count < basicRemoveScale.length ? basicRemoveScale[count] : 70;
      case 'copy': // Hanya satu tipe 'copy'
        return count < universalCopyScale.length ? universalCopyScale[count] : 70;
      default:
        console.warn("Tipe getScalingCost tidak dikenal:", type);
        return 0; // Failsafe
    }
  };

  const getCurrentCap = () => {
      const base = getRule('cap_base_tier_1', 30);
      const increment = getRule('cap_tier_increment', 10);
      return base + ((chaosTier - 1) * increment);
  };

  // Helper untuk cek nilai status kartu (Aturan 4, 5, 6 + Klarifikasi Baru)
  const getCardStatusValue = (card) => {
      const type = card.type;
      const tier = card.currentTier;
      
      // Aturan 1: Basic/Unique
      if (type === 'Basic' || type === 'Unique') {
          if (tier === 'Divine') return 20; // Klarifikasi: Basic/Unique Divine = +20
          return 0; // Epi = 0
      }
      
      // Aturan 2: Neutral/Monster
      if (tier === 'Epiphany') return getRule('bonus_epiphany', 10);
      if (tier === 'Divine') return 20; // Aturan 6: "divine +30"
      
      return 0; // Normal
  };

  // Helper cek harga dasar kartu (Neutral 20, Monster 80)
  const getCardBaseValue = (type) => {
      const costKey = `cost_${type.toLowerCase()}`;
      return getRule(costKey, 0);
  };

  // --- ACTIONS (LOGIKA BARU) ---

  // 1. UPGRADE TIER (FIXED)
  const handleTierChange = (newTier) => {
    if (!modalData) return;
    const { card, ownerId } = modalData;
    
    // Hitung poin berdasarkan logika baru
    const oldCost = getCardStatusValue(card);
    const newCost = getCardStatusValue({...card, currentTier: newTier});
    const costDiff = newCost - oldCost;

    updateCombatant(ownerId, (combatant) => {
        const updatedCards = combatant.liveCards.map(c => 
            c.uniqueId === card.uniqueId ? { ...c, currentTier: newTier } : c
        );
        return { 
            liveCards: updatedCards, 
            faintMemory: combatant.faintMemory + costDiff,
            historyLog: [`Upgrade: ${card.name} (${card.currentTier} -> ${newTier}): +${costDiff} Pts`, ...combatant.historyLog] 
        };
    });
    setModalData(null);
  };

  // 2. COPY CARD (Tombol Diaktifkan, logika sementara)
  // 2. COPY CARD (FIXED - Logic baru)
  const handleCopy = () => {
    if (!modalData) return;
    const { card, ownerId } = modalData;
    
    updateCombatant(ownerId, (combatant) => {
        const currentCount = combatant.counters.duplication;
        
        // Aturan 1: Biaya Aksi (0, 10, 30...)
        const actionCost = getScalingCost(currentCount, 'copy');
        
        // Aturan 2: Nilai Bawaan Kartu (Base + Status)
        const baseValue = getCardBaseValue(card.type); // Basic=0, Neutral=20, Monster=80
        const statusValue = getCardStatusValue(card); // Epi/Divine bonuses
        
        // Total Poin = Biaya Aksi + Nilai Bawaan Kartu
        const totalCost = actionCost + baseValue + statusValue;

        const newCard = {
            ...card,
            uniqueId: `${ownerId}_copy_${Date.now()}`,
            isCopy: true,
            isStarting: false,
            isConverted: false 
        };

        return {
            liveCards: [...combatant.liveCards, newCard],
            faintMemory: combatant.faintMemory + totalCost,
            // Tetap gunakan satu counter duplikasi
            counters: { ...combatant.counters, duplication: currentCount + 1 },
            historyLog: [`Copy #${currentCount + 1} (${card.name}): +${totalCost} (Aksi: ${actionCost} + Nilai: ${baseValue+statusValue})`, ...combatant.historyLog]
        };
    });
    setModalData(null);
  };

  // 3. REMOVE CARD (FIXED - Bug Skala Lompat)
  const handleRemove = () => {
    if (!modalData) return;
    const { card, ownerId } = modalData;

    updateCombatant(ownerId, (combatant) => {
        let actionCost = 0;
        let currentCount = 0;
        let updatedCounters = { ...combatant.counters };

        // Aturan 1 & 3: Hapus Basic/Unique/Converted
        if (card.isStarting || card.isConverted) {
            currentCount = combatant.counters.removal_basic;
            actionCost = getScalingCost(currentCount, 'basic_remove'); // Skala 20, 30, 50...
            updatedCounters.removal_basic = currentCount + 1; // Update counter (immutable)
        } 
        // Aturan 2: Hapus Neutral/Monster murni
        else {
            currentCount = combatant.counters.removal_neutral;
            actionCost = getScalingCost(currentCount, 'neutral_remove'); // Skala 0, 10, 30...
            updatedCounters.removal_neutral = currentCount + 1; // Update counter (immutable)
        }
        
        // Aturan 8: Refund poin
        const statusCost = getCardStatusValue(card);
        const baseCost = getCardBaseValue(card.type);
        const refundPoints = baseCost + statusCost;

        const totalPointChange = actionCost - refundPoints;
        const updatedCards = combatant.liveCards.filter(c => c.uniqueId !== card.uniqueId);

        return {
            liveCards: updatedCards,
            faintMemory: combatant.faintMemory + totalPointChange,
            counters: updatedCounters, // Simpan counter yang baru
            historyLog: [`Remove: ${card.name} (Cost: +${actionCost}, Refund: -${refundPoints})`, ...combatant.historyLog]
        };
    });
    setModalData(null);
  };

  // 4. CONVERT (FIXED - Bug Poin)
  const handleExecuteConvert = (targetCard) => {
    if (!convertSelector) return;
    const { sourceCard, ownerId } = convertSelector;
    
    // Harusnya 10
    const actionCost = getRule('action_convert', 10); 
    // Harusnya 20 (jika 'cost_neutral' di DB 20)
    const newCardValue = getCardBaseValue(targetCard.type); 
    
    // Aturan 8 (Implisit): Refund status kartu lama
    const oldStatusCost = getCardStatusValue(sourceCard);
    
    // Total = (10 + 20) - status lama
    const totalPointChange = (actionCost + newCardValue) - oldStatusCost;

    updateCombatant(ownerId, (combatant) => {
        const updatedCards = combatant.liveCards.map(c => {
            if (c.uniqueId === sourceCard.uniqueId) {
                return {
                    ...c,
                    name: targetCard.name,
                    type: targetCard.type,
                    imageUrl: targetCard.imageUrl,
                    description: targetCard.description,
                    currentTier: 'Normal',
                    isConverted: true 
                };
            }
            return c;
        });

        return {
            liveCards: updatedCards,
            faintMemory: combatant.faintMemory + totalPointChange,
            historyLog: [`Convert (${sourceCard.name} -> ${targetCard.name}): +${totalPointChange} Pts`, ...combatant.historyLog]
        };
    });
    setConvertSelector(null);
  };

  // 5. ADD NEW CARD (FIXED - Bug Poin)
  const handleManualAdd = (targetCard) => {
      if(!addCardModal) return;
      const { ownerId } = addCardModal;
      
      // Harusnya 20 (jika 'cost_neutral' di DB 20)
      const cardCost = getCardBaseValue(targetCard.type); 

      updateCombatant(ownerId, (combatant) => {
          const newCard = {
              ...targetCard,
              uniqueId: `${ownerId}_add_${Date.now()}`,
              currentTier: 'Normal',
              isStarting: false,
              isCopy: false,
              isConverted: false
          };
          
          return {
              liveCards: [...combatant.liveCards, newCard],
              faintMemory: combatant.faintMemory + cardCost,
              historyLog: [`Added Card: ${targetCard.name} (+${cardCost})`, ...combatant.historyLog]
          };
      });
      setAddCardModal(null);
  };

  const updateCombatant = (id, updateFn) => {
    setActiveTeam(prev => prev.map(p => {
        if (p.id === id) {
            const updates = updateFn(p);
            return { ...p, ...updates };
        }
        return p;
    }));
  };

  if (loading) return <div className="bg-slate-900 min-h-screen text-white p-10">Loading System...</div>;

  // --- RENDER (TAMPILAN) ---
  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans relative">
      
      {/* Header */}
      <header className="mb-8 flex justify-between items-center bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
        {/* ... (Tidak ada perubahan di Header) ... */}
        <div className="flex items-center gap-6">
            <div>
                <h1 className="text-2xl font-bold text-cyan-400">Chaos Zero Nightmare</h1>
                <p className="text-xs text-slate-400">Calculator (Logic v3.0)</p>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded border border-slate-600">
                <label className="text-sm font-bold text-yellow-400">Chaos Tier:</label>
                <select 
                    value={chaosTier} 
                    onChange={(e) => setChaosTier(parseInt(e.target.value))}
                    className="bg-slate-700 text-white text-sm rounded p-1 outline-none border border-slate-500"
                >
                    {[...Array(15)].map((_, i) => (<option key={i} value={i + 1}>Tier {i + 1}</option>))}
                </select>
            </div>
        </div>
        <div className="text-right text-xs text-slate-500">
            <p>Max Cap: <span className="text-white font-bold">{getCurrentCap()} Pts</span></p>
        </div>
      </header>

      {/* Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTeam.map((player) => (
            <div key={player.id} className="bg-slate-800/40 border border-slate-600 rounded-xl overflow-hidden flex flex-col h-full shadow-xl">
                {/* Player Header */}
                <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-600">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center border-2 border-cyan-500 overflow-hidden shadow-lg">
                            {player.info.imageUrl ? (<img src={player.info.imageUrl} alt={player.info.name} className="w-full h-full object-cover" />) : <span className="text-[9px]">IMG</span>}
                        </div>
                        <div>
                            <h2 className="font-bold">{player.info.name}</h2>
                            <div className="flex gap-2 text-[9px] text-slate-400">
                                <span>D: {player.counters.duplication}</span>
                                <span>R-B: {player.counters.removal_basic}</span>
                                <span>R-N: {player.counters.removal_neutral}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`block text-2xl font-bold ${player.faintMemory > getCurrentCap() ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                            {player.faintMemory}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-slate-500">/ {getCurrentCap()} Max</span>
                    </div>
                </div>

                {/* Card Area */}
                {/* ... (Tidak ada perubahan di Card Area) ... */}
                <div className="flex-1 p-4 bg-black/20 overflow-y-auto min-h-[400px]">
                    <div className="grid grid-cols-2 gap-3">
                        {player.liveCards.map((card) => (
                            <div 
                                key={card.uniqueId} 
                                onClick={() => setModalData({ card, ownerId: player.id })}
                                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-xl aspect-[2/3]
                                    ${card.isConverted ? 'border-yellow-500' : ''}
                                    ${!card.isConverted && card.type === 'Basic' ? 'border-cyan-500' : ''}
                                    ${!card.isConverted && card.type === 'Unique' ? 'border-indigo-500' : ''}
                                    ${!card.isConverted && card.type === 'Neutral' ? 'border-slate-400' : ''}
                                    ${!card.isConverted && card.type === 'Monster' ? 'border-red-600' : ''}
                                `}
                            >
                                {card.imageUrl ? (<img src={card.imageUrl} alt={card.name} className="absolute inset-0 w-full h-full object-cover z-0" />) : (<div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-xs text-slate-500">No IMG</div>)}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10"></div>
                                <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 text-white">
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[8px] font-bold uppercase px-1 rounded ${card.isConverted ? 'bg-yellow-500 text-black' : 'bg-slate-200 text-black'}`}>{card.isConverted ? 'CONVERTED' : card.type}</span>
                                        {card.currentTier !== 'Normal' && (<span className="text-[8px] font-bold uppercase bg-yellow-400 text-black px-1 rounded">{card.currentTier}</span>)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm leading-tight mb-1">{card.name}</div>
                                        <p className="text-[9px] text-slate-300 line-clamp-2 leading-tight">{card.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setAddCardModal({ ownerId: player.id })} className="aspect-[2/3] rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 hover:border-slate-400 hover:text-white transition-all">
                            <span className="text-4xl font-light mb-2">+</span>
                            <span className="text-xs font-bold">ADD CARD</span>
                        </button>
                    </div>
                </div>

                {/* Log Footer */}
                <div className="p-2 bg-slate-950 text-[10px] text-slate-400 h-24 overflow-y-auto border-t border-slate-700 font-mono">
                    {player.historyLog.map((log, i) => (<div key={i} className="mb-1 border-b border-slate-800 pb-1 border-dashed">&gt; {log}</div>))}
                </div>
            </div>
        ))}
      </div>

      {/* MODAL: MANAGE CARD (FIXED) */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setModalData(null)}>
            <div className="bg-slate-800 border border-slate-500 rounded-lg shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-xl">Manage Card</h3>
                    <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-6">
                    {/* Preview Card */}
                    <div className="flex gap-4 mb-6">
                         <div className="relative w-24 h-36 rounded border overflow-hidden flex-shrink-0">
                             {modalData.card.imageUrl && <img src={modalData.card.imageUrl} className="absolute inset-0 w-full h-full object-cover"/>}
                         </div>
                         <div className="flex-1">
                             <h4 className="font-bold text-lg">{modalData.card.name}</h4>
                             <p className="text-xs text-slate-400 mb-3">{modalData.card.description}</p>
                             
                             {/* PERBAIKAN: Tombol Upgrade sekarang selalu muncul */}
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => handleTierChange('Epiphany')} 
                                    disabled={modalData.card.currentTier !== 'Normal'} 
                                    className="flex-1 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 rounded text-[10px] font-bold"
                                >
                                    Epiphany
                                </button>
                                <button 
                                    onClick={() => handleTierChange('Divine')} 
                                    disabled={modalData.card.currentTier === 'Divine'} 
                                    className="flex-1 py-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 rounded text-[10px] font-bold"
                                >
                                    Divine
                                </button>
                             </div>
                         </div>
                    </div>
                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={handleCopy} 
                            className="py-3 bg-blue-700 hover:bg-blue-600 rounded text-sm font-bold flex flex-col items-center gap-1"
                        >
                            <span>Copy</span>
                            <span className="text-[9px] opacity-80">Cost: +{getScalingCost(activeTeam.find(c => c.id === modalData.ownerId).counters.duplication, 'basic_copy')}</span>
                        </button>
                        <button 
                            onClick={handleRemove} 
                            className="py-3 bg-red-700 hover:bg-red-600 rounded text-sm font-bold flex flex-col items-center gap-1"
                        >
                            <span>Remove</span>
                            <span className="text-[9px] opacity-80">Cost: +?</span>
                        </button>
                        <button 
                            onClick={() => { setConvertSelector({ sourceCard: modalData.card, ownerId: modalData.ownerId }); setModalData(null); }} 
                            disabled={!modalData.card.isStarting || modalData.card.isConverted} 
                            className="py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-30 rounded text-sm font-bold flex flex-col items-center gap-1"
                        >
                            <span>Convert</span>
                            <span className="text-[9px] opacity-80">Cost: +{getRule('action_convert', 10) + getRule('cost_neutral', 20)}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL: SELECT CARD (ADD / CONVERT) */}
      {/* ... (Tidak ada perubahan di Modal Select Card) ... */}
      {(addCardModal || convertSelector) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => { setAddCardModal(null); setConvertSelector(null); }}>
            <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 bg-slate-800 rounded-t-xl flex justify-between items-center">
                    <div><h3 className="font-bold text-xl text-white">{addCardModal ? "Select Card to Add" : "Select Conversion Target"}</h3></div>
                    <button onClick={() => { setAddCardModal(null); setConvertSelector(null); }} className="text-2xl text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {miscCards.map((card) => (
                            <div 
                                key={card.id}
                                onClick={() => {
                                    if (addCardModal) handleManualAdd(card);
                                    if (convertSelector) handleExecuteConvert(card);
                                }}
                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 border-slate-700 hover:border-cyan-500 hover:scale-105 transition-all aspect-[2/3] group`}
                            >
                                {card.imageUrl ? <img src={card.imageUrl} className="absolute inset-0 w-full h-full object-cover"/> : <div className="absolute inset-0 bg-slate-800"></div>}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-3 w-full">
                                    <span className={`text-[9px] font-bold px-1 rounded ${card.type==='Monster'?'bg-red-600':'bg-slate-200 text-black'}`}>{card.type}</span>
                                    <div className="font-bold text-sm text-white mt-1 leading-tight">{card.name}</div>
                                    <div className="text-[9px] text-slate-400 line-clamp-2">{card.description}</div>
                                </div>
                                <div className="absolute inset-0 bg-cyan-500/30 hidden group-hover:flex items-center justify-center font-bold text-white">SELECT</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </main>
  );
}
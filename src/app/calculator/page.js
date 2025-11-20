"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading Route...</div>}>
      <CalculatorLogic />
    </Suspense>
  );
}

function CalculatorLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamIds = searchParams.get("ids")?.split(",") || [];

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState({});
  const [miscCards, setMiscCards] = useState([]);
  const [chaosTier, setChaosTier] = useState(1);
  
  // --- STATE UTAMA ---
  const [activeTeam, setActiveTeam] = useState([]);

  // Undo History (Personal per player)
  const [historyStacks, setHistoryStacks] = useState({});
  
  // Cache untuk Reset
  const [initialDataCache, setInitialDataCache] = useState({ combatants: [] });

  // Modals
  const [modalData, setModalData] = useState(null);
  const [addCardModal, setAddCardModal] = useState(null); 
  const [convertSelector, setConvertSelector] = useState(null);
  
  // Track kartu yang sedang dihapus untuk animasi
  const [deletingCard, setDeletingCard] = useState(null);

  // --- INIT DATA ---
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
          setInitialDataCache({ combatants: result.data.combatants });
          setupInitialState(result.data.combatants);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    
    const setupInitialState = (combatantData) => {
        const selectedCombatants = combatantData.filter((c) => 
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
            counters: { duplication: 0, removal: 0 },
            historyLog: []
        }));
        setActiveTeam(initialTeamState);
        setHistoryStacks({});
    };
    
    initData();
  }, []);

  // --- FUNGSI HELPER ---
  const getRule = (key, defaultVal) => rules[key] !== undefined ? rules[key] : defaultVal;
  
  const getScalingCost = (count) => {
    const scale = [0, 10, 30, 50, 70];
    return count < scale.length ? scale[count] : 70;
  };

  const getCurrentCap = () => {
      const base = getRule('cap_base_tier_1', 30);
      const increment = getRule('cap_tier_increment', 10);
      return base + ((chaosTier - 1) * increment);
  };

  const getCardStatusValue = (card) => {
      const tier = card.currentTier;
      if (tier === 'Divine') return 20;
      if (card.type === 'Basic' || card.type === 'Unique') {
          if (tier === 'Epiphany') return 0;
      }
      if (card.type === 'Neutral' || card.type === 'Monster' || card.type === 'Forbidden') {
          if (tier === 'Epiphany') return getRule('bonus_epiphany', 10);
      }
      return 0;
  };

  const getCardBaseValue = (type) => {
      if (type === 'Basic' || type === 'Unique') return 0;
      const costKey = `cost_${type.toLowerCase()}`;
      return getRule(costKey, 0);
  };

  const getCardRemoveBase = (card) => {
      if (card.isStarting && !card.isConverted) {
          return 20;
      } 
      else {
          return getCardBaseValue(card.type) * -1;
      }
  };

  // --- STATE MANAGEMENT (UNDO PERSONAL) ---
  const applyStateChange = (newTeamState, logInfo) => {
      if (logInfo.ownerId) {
          setHistoryStacks(prev => ({
              ...prev,
              [logInfo.ownerId]: [
                  ...(prev[logInfo.ownerId] || []),
                  activeTeam.find(p => p.id === logInfo.ownerId)
              ]
          }));
      }
      
      if (logInfo.ownerId && logInfo.message) {
          newTeamState = newTeamState.map(player => {
              if (player.id === logInfo.ownerId) {
                  return { ...player, historyLog: [logInfo.message, ...player.historyLog] };
              }
              return player;
          });
      }
      setActiveTeam(newTeamState);
  };

  // --- ACTIONS ---

  const handleTierChange = (newTier) => {
    if (!modalData) return;
    const { card, ownerId } = modalData;
    
    const oldCost = getCardStatusValue(card);
    const newCost = getCardStatusValue({...card, currentTier: newTier});
    const costDiff = newCost - oldCost;

    const newTeamState = activeTeam.map(player => {
        if (player.id === ownerId) {
            const updatedCards = player.liveCards.map(c => 
                c.uniqueId === card.uniqueId ? { ...c, currentTier: newTier } : c
            );
            return { ...player, liveCards: updatedCards, faintMemory: player.faintMemory + costDiff };
        }
        return player;
    });
    
    applyStateChange(newTeamState, { ownerId, message: `Upgrade: ${card.name} (${card.currentTier} -> ${newTier}): +${costDiff} Pts` });
    setModalData(null);
  };

  const handleCopy = () => {
    if (!modalData) return;
    const { card, ownerId } = modalData;

    const player = activeTeam.find(p => p.id === ownerId);
    const currentCount = player.counters.duplication;
    
    const actionCost = getScalingCost(currentCount);
    const baseValue = getCardBaseValue(card.type);
    const statusValue = getCardStatusValue(card);
    const totalCost = actionCost + baseValue + statusValue;

    const newTeamState = activeTeam.map(p => {
        if (p.id === ownerId) {
            const newCard = {
                ...card,
                uniqueId: `${ownerId}_copy_${Date.now()}`,
                isCopy: true, isStarting: false, isConverted: false 
            };
            return {
                ...p,
                liveCards: [...p.liveCards, newCard],
                faintMemory: p.faintMemory + totalCost,
                counters: { ...p.counters, duplication: currentCount + 1 }
            };
        }
        return p;
    });

    applyStateChange(newTeamState, { ownerId, message: `Copy: ${card.name} (Cost Copy: +${actionCost}, Base Card: +${baseValue + statusValue}) = +${totalCost} Pts` });
    setModalData(null);
  };

  const handleRemove = () => {
    if (!modalData) return;
    const { card, ownerId } = modalData;

    const player = activeTeam.find(p => p.id === ownerId);
    const currentCount = player.counters.removal;

    const actionCost = getScalingCost(currentCount);
    const removeBase = getCardRemoveBase(card);
    const statusRefund = getCardStatusValue(card);
    
    const totalPointChange = actionCost + removeBase - statusRefund;

    // Tutup modal terlebih dahulu, tapi simpan data untuk animasi
    setDeletingCard({ card, ownerId, isBurning: false });
    setModalData(null);
    
    // Mulai animasi burn setelah modal tertutup
    setTimeout(() => {
        setDeletingCard(prev => prev ? { ...prev, isBurning: true } : null);
    }, 50);
    
    setTimeout(() => {
        const newTeamState = activeTeam.map(p => {
            if (p.id === ownerId) {
                const updatedCards = p.liveCards.filter(c => c.uniqueId !== card.uniqueId);
                return {
                    ...p,
                    liveCards: updatedCards,
                    faintMemory: p.faintMemory + totalPointChange,
                    counters: { ...p.counters, removal: currentCount + 1 }
                };
            }
            return p;
        });
        
        applyStateChange(newTeamState, { ownerId, message: `Remove: ${card.name} (Cost Remove: +${actionCost}, Base Card: ${removeBase}, Status Refund: -${statusRefund}) = ${totalPointChange} Pts` });
        setDeletingCard(null);
    }, 800);
  };

  const handleExecuteConvert = (targetCard) => {
    if (!convertSelector) return;
    const { sourceCard, ownerId } = convertSelector;
    
    const actionCost = getRule('action_convert', 10); 
    const newCardValue = getCardBaseValue(targetCard.type);
    const oldStatusRefund = getCardStatusValue(sourceCard);
    const totalPointChange = (actionCost + newCardValue) - oldStatusRefund;

    const newTeamState = activeTeam.map(p => {
        if (p.id === ownerId) {
            const updatedCards = p.liveCards.map(c => {
                if (c.uniqueId === sourceCard.uniqueId) {
                    return { ...c, name: targetCard.name, type: targetCard.type, imageUrl: targetCard.imageUrl, description: targetCard.description, currentTier: 'Normal', isConverted: true };
                }
                return c;
            });
            return { ...p, liveCards: updatedCards, faintMemory: p.faintMemory + totalPointChange };
        }
        return p;
    });

    applyStateChange(newTeamState, { ownerId, message: `Convert (${sourceCard.name} -> ${targetCard.name}): +${totalPointChange} Pts` });
    setConvertSelector(null);
  };

  const handleManualAdd = (targetCard) => {
      if(!addCardModal) return;
      const { ownerId } = addCardModal;
      
      const cardCost = getCardBaseValue(targetCard.type); 

      const newTeamState = activeTeam.map(p => {
          if (p.id === ownerId) {
              const newCard = {
                  ...targetCard,
                  uniqueId: `${ownerId}_add_${Date.now()}`,
                  currentTier: 'Normal', isStarting: false, isCopy: false, isConverted: false
              };
              return {
                  ...p,
                  liveCards: [...p.liveCards, newCard],
                  faintMemory: p.faintMemory + cardCost
              };
          }
          return p;
      });

      applyStateChange(newTeamState, { ownerId, message: `Add: ${targetCard.name} (Base Card: +${cardCost})` });
      setAddCardModal(null);
  };

  // --- UI FUNCTIONS ---
  const handleResetPlayer = (playerId) => {
      if (!confirm("Reset kalkulasi combatan ini?")) return;
      const selectedCombatants = initialDataCache.combatants.filter((c) => c.id === playerId);
      
      const newTeamState = activeTeam.map(player => {
          if (player.id === playerId) {
              const char = selectedCombatants[0];
              return {
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
                  counters: { duplication: 0, removal: 0 },
                  historyLog: []
              };
          }
          return player;
      });
      
      setActiveTeam(newTeamState);
      setHistoryStacks(prev => ({...prev, [playerId]: []}));
  };

  const handleUndoPlayer = (playerId) => {
      const playerHistory = historyStacks[playerId] || [];
      if (playerHistory.length === 0) {
          alert("Tidak ada aksi untuk di-undo.");
          return;
      }
      
      const previousPlayerState = playerHistory[playerHistory.length - 1];
      const newTeamState = activeTeam.map(p => p.id === playerId ? previousPlayerState : p);
      
      setActiveTeam(newTeamState);
      setHistoryStacks(prev => ({
          ...prev,
          [playerId]: playerHistory.slice(0, -1)
      }));
  };

  // Fungsi untuk sort kartu (Basic dulu, baru Unique)
  const getSortedCards = (cards) => {
      const typeOrder = { 'Basic': 0, 'Unique': 1, 'Neutral': 2, 'Monster': 3, 'Forbidden': 4 };
      return [...cards].sort((a, b) => {
          const typeA = typeOrder[a.type] ?? 999;
          const typeB = typeOrder[b.type] ?? 999;
          return typeA - typeB;
      });
  };

  if (loading) return <div className="bg-slate-900 min-h-screen text-white p-10">Loading System...</div>;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans relative pb-20">
      {/* Header */}
      <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
        <div className="flex items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-cyan-400">Chaos Zero Nightmare</h1>
                <p className="text-xs text-slate-400">Calculator (Personal Counters)</p>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded border border-slate-600">
                <label className="text-sm font-bold text-yellow-400">Tier:</label>
                <select value={chaosTier} onChange={(e) => setChaosTier(parseInt(e.target.value))} className="bg-slate-700 text-white text-sm rounded p-1 outline-none border border-slate-500">
                    {[...Array(15)].map((_, i) => (<option key={i} value={i + 1}>Tier {i + 1}</option>))}
                </select>
            </div>
        </div>
        <div className="bg-black/20 p-2 rounded-md border border-slate-700">
            <div className="text-xs text-slate-500">Max Cap</div>
            <div className="text-lg font-bold text-white text-right">{getCurrentCap()} Pts</div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="mb-8 flex flex-wrap gap-3 items-center">
          <Link href="/" className="px-4 py-2 bg-slate-600 text-white text-sm font-bold rounded shadow hover:bg-slate-500">⟲ Change Team</Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTeam.map((player) => (
            <div key={player.id} className="bg-slate-800/40 border border-slate-600 rounded-xl overflow-hidden flex flex-col h-full shadow-xl">
                {/* Player Header dengan Personal Controls */}
                <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-600">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center border-2 border-cyan-500 overflow-hidden shadow-lg">
                            {player.info.imageUrl ? (<img src={player.info.imageUrl} alt={player.info.name} className="w-full h-full object-cover" />) : <span className="text-[9px]">IMG</span>}
                        </div>
                        <div>
                            <h2 className="font-bold">{player.info.name}</h2>
                            <div className="flex gap-2 text-[9px] text-slate-400">
                                <span>D: {player.counters.duplication}</span>
                                <span>R: {player.counters.removal}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`block text-2xl font-bold ${player.faintMemory > getCurrentCap() ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>{player.faintMemory}</span>
                        <span className="text-[8px] uppercase tracking-widest text-slate-500">/ {getCurrentCap()} Max</span>
                    </div>
                </div>

                {/* Player Controls (Personal Undo & Reset) */}
                <div className="flex gap-2 px-4 py-2 bg-slate-750 border-b border-slate-700">
                    <button onClick={() => handleUndoPlayer(player.id)} disabled={(historyStacks[player.id] || []).length === 0} className="flex-1 px-2 py-1 bg-yellow-600 text-black text-xs font-bold rounded shadow hover:bg-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed">↶ Undo</button>
                    <button onClick={() => handleResetPlayer(player.id)} className="flex-1 px-2 py-1 bg-red-700 text-white text-xs font-bold rounded shadow hover:bg-red-600">↻ Reset</button>
                </div>

                <div className="flex-1 p-4 bg-black/20 overflow-y-auto min-h-[400px]">
                    <div className="grid grid-cols-2 gap-3">
                        {getSortedCards(player.liveCards).map((card) => (
                            <div key={card.uniqueId} className="relative">
                                {/* Main Card */}
                                <div 
                                    onClick={() => setModalData({ card, ownerId: player.id })}
                                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-xl aspect-[2/3]
                                        ${deletingCard && deletingCard.card.uniqueId === card.uniqueId ? 'opacity-100 scale-100' : 'opacity-100 scale-100'}
                                        ${card.isConverted ? 'border-yellow-500' : ''}
                                        ${!card.isConverted && card.type === 'Basic' ? 'border-cyan-500' : ''}
                                        ${!card.isConverted && card.type === 'Unique' ? 'border-indigo-500' : ''}
                                        ${!card.isConverted && card.type === 'Neutral' ? 'border-slate-400' : ''}
                                        ${!card.isConverted && card.type === 'Monster' ? 'border-red-600' : ''}
                                    `}
                                >
                                    {card.imageUrl ? (<img src={card.imageUrl} alt={card.name} className="absolute inset-0 w-full h-full object-cover z-0" />) : (<div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-xs text-slate-500">No IMG</div>)}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10"></div>
                                    <div className="absolute inset-0 z-20 flex flex-col justify-between p-2 text-white">
                                        <div className="flex justify-between items-start">
                                            <div className="w-6 h-6 flex items-center justify-center bg-black/70 border border-white/50 rounded-full text-sm font-bold text-white shadow-lg">{card.cost}</div>
                                            {card.currentTier !== 'Normal' && (<span className="text-[8px] font-bold uppercase bg-yellow-400 text-black px-1 rounded shadow-md">{card.currentTier}</span>)}
                                        </div>
                                        <div className="mt-auto">
                                            <span className={`text-[8px] font-bold uppercase px-1 rounded shadow-md mb-1 inline-block ${card.isConverted ? 'bg-yellow-500 text-black' : 'bg-slate-200 text-black'}`}>{card.isConverted ? 'CONVERTED' : card.type}</span>
                                            <div className="font-bold text-sm leading-none mb-1 drop-shadow-md text-white">{card.name}</div>
                                            <p className="text-[9px] text-slate-200 line-clamp-2 leading-tight font-light opacity-90 drop-shadow-sm">{card.description || "-"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Copy Badge/Indicator */}
                                {card.isCopy && (
                                    <div className="absolute -top-1 -right-1 z-30 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg text-xs font-bold text-black">
                                        ⓓ
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={() => setAddCardModal({ ownerId: player.id })} className="aspect-[2/3] rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 hover:border-slate-400 hover:text-white transition-all">
                            <span className="text-4xl font-light mb-2">+</span>
                            <span className="text-xs font-bold">ADD CARD</span>
                        </button>
                    </div>
                </div>
                <div className="p-2 bg-slate-950 text-[10px] text-slate-400 h-24 overflow-y-auto border-t border-slate-700 font-mono">
                    {player.historyLog.map((log, i) => (<div key={i} className="mb-1 border-b border-slate-800 pb-1 border-dashed">&gt; {log}</div>))}
                </div>
            </div>
        ))}
      </div>

      {/* MODAL: MANAGE CARD */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setModalData(null)}>
            <div className="bg-slate-800 border border-slate-500 rounded-lg shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-xl">Manage Card</h3>
                    <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-6">
                    <div className="flex gap-4 mb-6">
                         <div className="relative w-24 h-36 rounded border overflow-hidden flex-shrink-0">
                             {modalData.card.imageUrl && <img src={modalData.card.imageUrl} className="absolute inset-0 w-full h-full object-cover"/>}
                         </div>
                         <div className="flex-1">
                             <h4 className="font-bold text-lg">{modalData.card.name}</h4>
                             <p className="text-xs text-slate-400 mb-3">{modalData.card.description}</p>
                             <div className="flex gap-2">
                                <button onClick={() => handleTierChange('Epiphany')} disabled={modalData.card.currentTier !== 'Normal'} className="flex-1 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 rounded text-[10px] font-bold">Epiphany</button>
                                <button onClick={() => handleTierChange('Divine')} disabled={modalData.card.currentTier === 'Divine'} className="flex-1 py-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 rounded text-[10px] font-bold">Divine (+20)</button>
                             </div>
                         </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={handleCopy} className="py-3 bg-blue-700 hover:bg-blue-600 rounded text-sm font-bold flex flex-col items-center gap-1">
                            <span>Copy</span>
                            <span className="text-[9px] opacity-80">Cost: +{getScalingCost(activeTeam.find(c => c.id === modalData.ownerId).counters.duplication) + getCardBaseValue(modalData.card.type) + getCardStatusValue(modalData.card)}</span>
                        </button>
                        <button onClick={handleRemove} className="py-3 bg-red-700 hover:bg-red-600 rounded text-sm font-bold flex flex-col items-center gap-1">
                            <span>Remove</span>
                            <span className="text-[9px] opacity-80">Cost: {getScalingCost(activeTeam.find(c => c.id === modalData.ownerId).counters.removal) + getCardRemoveBase(modalData.card) - getCardStatusValue(modalData.card)}</span>
                        </button>
                        <button onClick={() => { setConvertSelector({ sourceCard: modalData.card, ownerId: modalData.ownerId }); setModalData(null); }} disabled={!modalData.card.isStarting || modalData.card.isConverted} className="py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-30 rounded text-sm font-bold flex flex-col items-center gap-1">
                            <span>Convert</span>
                            <span className="text-[9px] opacity-80">Cost: +{getRule('action_convert', 10) + getRule('cost_neutral', 20) - getCardStatusValue(modalData.card)}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ANIMASI BURN CARD - Overlay saat menghapus */}
      {deletingCard && deletingCard.isBurning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <style>{`
            @keyframes burn-and-disappear {
              0% {
                opacity: 1;
                transform: scale(1) rotate(0deg);
                filter: brightness(1);
              }
              30% {
                filter: brightness(1.5) saturate(1.5) hue-rotate(30deg);
              }
              60% {
                opacity: 0.5;
                filter: brightness(2) saturate(2) hue-rotate(60deg);
                transform: scale(0.95) rotate(5deg);
              }
              85% {
                opacity: 0.2;
                filter: brightness(3) saturate(0) blur(10px);
                transform: scale(0.7) rotate(-10deg) translateY(-20px);
              }
              100% {
                opacity: 0;
                filter: brightness(0) blur(20px);
                transform: scale(0) rotate(360deg) translateY(-100px);
              }
            }
            
            @keyframes burn-particles {
              0% {
                opacity: 1;
                transform: translate(0, 0) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate(var(--tx), var(--ty)) scale(0);
              }
            }
            
            .burn-card {
              animation: burn-and-disappear 0.75s ease-in forwards;
            }
            
            .burn-particle {
              position: absolute;
              animation: burn-particles 0.75s ease-out forwards;
            }
          `}</style>
          
          <div className="relative w-48 h-72">
            <div className="burn-card absolute inset-0 rounded-lg overflow-hidden border-2 border-orange-500">
              {deletingCard.card.imageUrl && (
                <img src={deletingCard.card.imageUrl} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-orange-600/80 via-orange-500/40 to-transparent"></div>
            </div>
            
            {/* Particle effects */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const distance = 150;
              const tx = Math.cos(angle) * distance;
              const ty = Math.sin(angle) * distance;
              return (
                <div
                  key={i}
                  className="burn-particle w-3 h-3 bg-orange-400 rounded-full"
                  style={{
                    '--tx': `${tx}px`,
                    '--ty': `${ty}px`,
                    left: '50%',
                    top: '50%',
                    marginLeft: '-6px',
                    marginTop: '-6px',
                    boxShadow: '0 0 10px rgba(255, 140, 0, 0.8)'
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL SELECTOR */}
      {(addCardModal || convertSelector) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => { setAddCardModal(null); setConvertSelector(null); }}>
            <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 bg-slate-800 rounded-t-xl flex justify-between items-center">
                    <div><h3 className="font-bold text-xl text-white">{addCardModal ? "Select Card" : "Select Conversion"}</h3></div>
                    <button onClick={() => { setAddCardModal(null); setConvertSelector(null); }} className="text-2xl text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {miscCards.map((card) => (
                            <div key={card.id} onClick={() => { if (addCardModal) handleManualAdd(card); if (convertSelector) handleExecuteConvert(card); }} className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-slate-700 hover:border-cyan-500 hover:scale-105 transition-all aspect-[2/3] group">
                                {card.imageUrl ? <img src={card.imageUrl} className="absolute inset-0 w-full h-full object-cover"/> : <div className="absolute inset-0 bg-slate-800"></div>}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-3 w-full">
                                    <span className={`text-[9px] font-bold px-1 rounded ${card.type==='Monster'?'bg-red-600':'bg-slate-200 text-black'}`}>{card.type}</span>
                                    <div className="font-bold text-sm text-white mt-1 leading-tight">{card.name}</div>
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
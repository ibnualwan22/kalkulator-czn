"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("combatants");
  const [loading, setLoading] = useState(false);
  
  // DATA STATE
  const [combatants, setCombatants] = useState([]);
  const [rules, setRules] = useState([]);

  // --- LOAD ALL DATA ---
  const loadAllData = async () => {
    setLoading(true);
    const res = await fetch("/api/initial-data");
    const result = await res.json();
    if (result.success) {
      setCombatants(result.data.combatants);
      setRules(result.data.rules);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6">Control Panel</h1>

        {/* TAB NAVIGATION */}
        <div className="flex gap-4 border-b border-slate-800 mb-8 overflow-x-auto">
            <button onClick={() => setActiveTab("combatants")} className={`pb-3 px-4 font-bold whitespace-nowrap ${activeTab === 'combatants' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>Combatants</button>
            <button onClick={() => setActiveTab("cards")} className={`pb-3 px-4 font-bold whitespace-nowrap ${activeTab === 'cards' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>Card Manager</button>
            <button onClick={() => setActiveTab("rules")} className={`pb-3 px-4 font-bold whitespace-nowrap ${activeTab === 'rules' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>Game Logic</button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === "combatants" && <CombatantManager data={combatants} refresh={loadAllData} />}
        {activeTab === "cards" && <CardManager combatants={combatants} />}
        {activeTab === "rules" && <RuleManager data={rules} refresh={loadAllData} />}

      </div>
    </main>
  );
}

// ==========================================
// 1. COMBATANT MANAGER (ADD / EDIT / DELETE)
// ==========================================
function CombatantManager({ data, refresh }) {
    const [editingId, setEditingId] = useState(null); // Null = Mode Tambah, ID = Mode Edit
    const [name, setName] = useState("");
    const [imgUrl, setImgUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    // Reset form saat mode berubah
    const resetForm = () => {
        setEditingId(null);
        setName("");
        setImgUrl("");
    };

    // Isi form saat tombol Edit diklik
    const handleEditClick = (combatant) => {
        setEditingId(combatant.id);
        setName(combatant.name);
        setImgUrl(combatant.imageUrl || "");
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (json.success) setImgUrl(json.url);
        setUploading(false);
    };

    const handleSubmit = async () => {
        if (!name) return alert("Nama wajib diisi");
        
        if (editingId) {
            // MODE EDIT
            await fetch("/api/combatants", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingId, name, imageUrl: imgUrl })
            });
        } else {
            // MODE TAMBAH
            await fetch("/api/combatants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, imageUrl: imgUrl })
            });
        }
        refresh();
        resetForm();
    };

    const handleDelete = async (id) => {
        if(!confirm("Hapus karakter ini? Kartu mereka juga akan hilang!")) return;
        await fetch(`/api/combatants?id=${id}`, { method: "DELETE" });
        refresh();
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-slate-900 p-6 rounded border border-slate-800 h-fit sticky top-4">
                <h3 className="font-bold mb-4 text-xl text-white">
                    {editingId ? "Edit Combatant" : "Add New Combatant"}
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-black border border-slate-600 overflow-hidden flex-shrink-0">
                            {imgUrl && <img src={imgUrl} className="w-full h-full object-cover"/>}
                        </div>
                        <input type="file" onChange={handleUpload} className="block w-full text-sm text-slate-400"/>
                    </div>
                    {uploading && <p className="text-xs text-yellow-500">Uploading...</p>}
                    
                    <input 
                        type="text" placeholder="Character Name" 
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded outline-none focus:border-cyan-500"
                        value={name} onChange={e => setName(e.target.value)}
                    />
                    
                    <div className="flex gap-2">
                        {editingId && (
                            <button onClick={resetForm} className="flex-1 bg-slate-700 py-2 rounded font-bold hover:bg-slate-600">
                                Cancel
                            </button>
                        )}
                        <button onClick={handleSubmit} className="flex-1 bg-cyan-600 py-2 rounded font-bold hover:bg-cyan-500">
                            {editingId ? "Update Changes" : "+ Create Combatant"}
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {data.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded hover:border-slate-600 transition-colors">
                        <div className="flex items-center gap-3">
                            <img src={c.imageUrl || "/placeholder.png"} className="w-10 h-10 rounded-full bg-black object-cover border border-slate-600"/>
                            <span className="font-bold">{c.name}</span>
                        </div>
                        <div className="flex gap-3 text-sm">
                            <button onClick={() => handleEditClick(c)} className="text-cyan-400 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ==========================================
// 2. CARD MANAGER (ADD / EDIT / DELETE / LIST)
// ==========================================
function CardManager({ combatants }) {
    const [cards, setCards] = useState([]); // Daftar semua kartu
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Form State
    const initialForm = { name: "", type: "Neutral", description: "", cost: 0, combatantId: "", imageUrl: "" };
    const [form, setForm] = useState(initialForm);

    // Load Kartu
    const loadCards = async () => {
        const res = await fetch("/api/cards"); // Kita pakai endpoint GET yang sudah dibuat sebelumnya
        const json = await res.json();
        if (json.success) setCards(json.data);
    };
    useEffect(() => { loadCards(); }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (json.success) setForm(prev => ({ ...prev, imageUrl: json.url }));
        setUploading(false);
    };

    const handleEdit = (card) => {
        setEditingId(card.id);
        setForm({
            name: card.name,
            type: card.type,
            description: card.description || "",
            cost: card.cost,
            combatantId: card.combatantId || "",
            imageUrl: card.imageUrl || ""
        });
        // Scroll ke atas
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if(!confirm("Hapus kartu ini selamanya?")) return;
        await fetch(`/api/cards?id=${id}`, { method: "DELETE" });
        loadCards();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.imageUrl) return alert("Lengkapi data!");

        if (editingId) {
            // UPDATE
            await fetch("/api/cards", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingId, ...form })
            });
        } else {
            // CREATE
            await fetch("/api/cards", {
                 method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
            });
        }
        
        alert(editingId ? "Kartu Diupdate!" : "Kartu Dibuat!");
        setForm(initialForm);
        setEditingId(null);
        loadCards();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* KIRI: FORM (4 Kolom) */}
            <div className="lg:col-span-4">
                <div className="bg-slate-900 p-6 rounded border border-slate-800 sticky top-4">
                    <h2 className="font-bold mb-4 text-xl">{editingId ? "Edit Card" : "Create New Card"}</h2>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        
                        {/* Upload Preview Kecil */}
                        <div className="flex gap-2 items-center">
                            {form.imageUrl && <img src={form.imageUrl} className="w-12 h-16 object-cover rounded border border-slate-600"/>}
                            <input type="file" onChange={handleUpload} className="text-xs text-slate-400 w-full"/>
                        </div>
                        {uploading && <span className="text-xs text-yellow-500">Uploading...</span>}
                        
                        <input type="text" placeholder="Card Name" className="w-full p-2 bg-slate-800 border border-slate-700 rounded focus:border-cyan-500 outline-none"
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        
                        <div className="flex gap-2">
                            <select className="p-2 bg-slate-800 border border-slate-700 rounded flex-1 text-sm"
                                value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                <option value="Neutral">Neutral</option>
                                <option value="Monster">Monster</option>
                                <option value="Basic">Basic</option>
                                <option value="Unique">Unique</option>
                                <option value="Forbidden">Forbidden</option>
                            </select>
                            <input type="number" placeholder="Cost" className="w-16 p-2 bg-slate-800 border border-slate-700 rounded text-sm"
                                value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
                        </div>

                        <select className="w-full p-2 bg-slate-800 border border-slate-700 rounded disabled:opacity-50 text-sm"
                            value={form.combatantId} onChange={e => setForm({...form, combatantId: e.target.value})}
                            disabled={form.type !== "Basic" && form.type !== "Unique"}>
                            <option value="">-- Select Owner --</option>
                            {combatants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <textarea placeholder="Description" rows="3" className="w-full p-2 bg-slate-800 border border-slate-700 rounded focus:border-cyan-500 outline-none text-sm"
                            value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>

                        <div className="flex gap-2 pt-2">
                            {editingId && (
                                <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); }} className="flex-1 bg-slate-700 py-2 rounded font-bold hover:bg-slate-600">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" className="flex-1 bg-cyan-600 py-2 rounded font-bold hover:bg-cyan-500">
                                {editingId ? "Update" : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* KANAN: PREVIEW & LIST (8 Kolom) */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Live Preview */}
                <div className="bg-black/30 border border-dashed border-slate-700 p-6 rounded-xl flex justify-center">
                    <div className={`relative w-40 h-56 rounded-lg overflow-hidden border-2 shadow-2xl transition-all
                        ${form.type === 'Neutral' ? 'border-slate-400' : ''}
                        ${form.type === 'Monster' ? 'border-red-500' : ''}
                        ${form.type === 'Basic' || form.type === 'Unique' ? 'border-cyan-500' : ''}
                    `}>
                        {form.imageUrl ? <img src={form.imageUrl} className="absolute inset-0 w-full h-full object-cover z-0"/> : <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-xs text-slate-500">No Image</div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10"></div>
                        <div className="relative z-20 flex flex-col justify-between h-full p-3 text-white">
                            <div className="flex justify-between items-start">
                                <div className="bg-slate-200 text-black font-bold w-5 h-5 flex items-center justify-center rounded text-[10px]">{form.cost}</div>
                                <span className={`text-[8px] px-1 rounded font-bold uppercase ${form.type === 'Monster' ? 'bg-red-600' : 'bg-cyan-700'}`}>{form.type}</span>
                            </div>
                            <div className="mt-auto">
                                <h3 className="font-bold text-sm leading-none mb-1">{form.name || "Name"}</h3>
                                <div className="h-[1px] w-full bg-slate-500 mb-1 opacity-50"></div>
                                <p className="text-[9px] text-slate-200 leading-tight">{form.description || "Desc..."}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Kartu (Database) */}
                <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 font-bold">Database Kartu ({cards.length})</div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {cards.map(card => (
                            <div key={card.id} className="flex items-center justify-between p-3 border-b border-slate-800 hover:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <img src={card.imageUrl || "/placeholder.png"} className="w-10 h-14 object-cover rounded bg-black"/>
                                    <div>
                                        <div className="font-bold text-sm">{card.name}</div>
                                        <div className="text-xs text-slate-500 flex gap-2">
                                            <span>[{card.type}]</span>
                                            {card.combatant && <span className="text-cyan-500">Owned by {card.combatant.name}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-xs font-bold">
                                    <button onClick={() => handleEdit(card)} className="text-cyan-400 hover:text-white px-2 py-1 border border-cyan-900 rounded bg-cyan-900/20">EDIT</button>
                                    <button onClick={() => handleDelete(card.id)} className="text-red-500 hover:text-white px-2 py-1 border border-red-900 rounded bg-red-900/20">DEL</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

// ==========================================
// 3. RULE MANAGER (SAMA SEPERTI SEBELUMNYA)
// ==========================================
function RuleManager({ data, refresh }) {
    const handleUpdate = async (id, newValue) => {
        await fetch("/api/rules", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, value: newValue })
        });
        refresh();
    };
    return (
        <div className="bg-slate-900 p-6 rounded border border-slate-800">
            <h3 className="font-bold mb-6 text-xl">Game Logic Configuration</h3>
            <div className="grid gap-4">
                {data.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                            <div className="font-bold text-cyan-400">{rule.key}</div>
                            <div className="text-xs text-slate-400">{rule.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="number" defaultValue={rule.value} onBlur={(e) => handleUpdate(rule.id, e.target.value)} className="w-20 bg-black border border-slate-600 rounded p-1 text-right font-mono"/>
                            <span className="text-xs text-slate-500">pts</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
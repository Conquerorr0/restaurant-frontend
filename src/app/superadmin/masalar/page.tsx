"use client";

import React, { useState, useEffect } from "react";
import { LayoutGrid, Users, Banknote, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { tableService, Table } from "@/services/tableService";

export default function TableManagement() {
    const { token } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [tableName, setTableName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [floor, setFloor] = useState("");
    const [floors, setFloors] = useState<string[]>([]);
    const [newFloorName, setNewFloorName] = useState("");
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [selectedFloor, setSelectedFloor] = useState<string>("Tümü");

    useEffect(() => {
        if (token) fetchTables();
    }, [token]);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const res = await tableService.getTables(token!);
            if (res.success) {
                setTables(res.data);
                // Extract floors from tables + existing UI floors logic
                const existingFloors = Array.from(new Set(res.data.map(t => t.floor))).sort();
                setFloors(existingFloors.length > 0 ? existingFloors : ["Zemin Kat"]);
            }
        } catch (err: any) {
            console.error("Fetch tables error:", err);
            setError("Masalar yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Filter tables by building the list of unique floors + "Tümü"
    const floorOptions = ["Tümü", ...floors];
    const filteredTables = selectedFloor === "Tümü"
        ? tables
        : tables.filter(t => t.floor === selectedFloor);

    const handleAddFloor = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newFloorName.trim();
        if (!name || floors.includes(name)) return;
        setFloors((prev) => [...prev, name].sort());
        setNewFloorName("");
    };

    const handleRemoveFloor = async (floorName: string) => {
        const tableCount = tables.filter((t) => t.floor === floorName).length;
        if (tableCount > 0 && !(await showConfirm(`"${floorName}" katında ${tableCount} masa var. Yine de bu katı kaldırmak istiyor musunuz?`, "Kat Silme Onayı"))) return;
        setFloors((prev) => prev.filter((f) => f !== floorName));
        if (floor === floorName) setFloor("");
        if (selectedFloor === floorName) setSelectedFloor("Tümü"); // Reset filter if current floor is removed
    };

    const handleAddTable = async (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!tableName.trim() || !capacity.trim() || !floor) return;

        setError("");
        setSubmitting(true);
        try {
            const num = parseInt(capacity, 10);
            const res = await tableService.createTable({
                name: tableName.trim(),
                capacity: num,
                floor,
                status: "EMPTY"
            }, token!);

            if (res.success) {
                setTables(prev => [...prev, res.data]);
                setTableName("");
                setCapacity("");
                setFloor("");
            }
        } catch (err: any) {
            setError(err.message || "Masa eklenirken hata oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!(await showConfirm("Bu masayı silmek istediğinize emin misiniz?", "Masa Silme Onayı"))) return;
        setError(""); // Clear previous errors
        try {
            const res = await tableService.deleteTable(id, token!);
            if (res.success) {
                setTables(prev => prev.filter(t => t.id !== id));
            }
        } catch (err: any) {
            setError(err.message || "Silme işlemi başarısız");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 px-4">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-md italic">
                    MASA YÖNETİMİ
                </h1>
                <p className="text-[#808080] text-[15px] font-medium tracking-wide">
                    İşletme yerleşim planını düzenleyin
                </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start">
                {/* Sol: Yeni Masa Ekle */}
                <div className="w-full xl:w-[380px] flex-shrink-0 bg-[#1c1c1c] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group border border-[#27272a]/50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308]/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none transition-all duration-500 group-hover:bg-[#eab308]/10" />
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <LayoutGrid size={24} className="text-[#eab308]" />
                            <h2 className="text-xl font-black text-white tracking-wide uppercase italic">
                                {submitting ? "MASA EKLENİYOR..." : "+ YENİ MASA EKLE"}
                            </h2>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-sm font-bold flex items-center gap-3">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleAddTable} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">
                                    MASA ADI
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Bahçe-1, Masa-2"
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold border border-transparent hover:border-[#27272a]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">
                                    KAPASİTE (KİŞİ)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        placeholder="Örn: 4"
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                        className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold border border-transparent hover:border-[#27272a]"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#52525b]">
                                        <Users size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">
                                    KAT
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={floor}
                                        onChange={(e) => setFloor(e.target.value)}
                                        className="bg-[#0d0d0d] text-white px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold appearance-none border border-transparent hover:border-[#27272a]"
                                    >
                                        <option value="" disabled className="text-[#52525b]">
                                            Kat seçin
                                        </option>
                                        {floors.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#a1a1aa]" />
                                    </div>
                                </div>
                                {/* Kat ekle / kaldır */}
                                <div className="mt-4 pt-4 border-t border-[#27272a]">
                                    <p className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider mb-2">Kat Listesi Yönetimi</p>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Yeni kat"
                                            value={newFloorName}
                                            onChange={(e) => setNewFloorName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFloor(e as any))}
                                            className="flex-1 bg-[#0d0d0d] text-white placeholder-[#52525b] px-4 py-2.5 rounded-[12px] text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 border border-transparent hover:border-[#27272a]"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddFloor as any}
                                            className="bg-[#eab308] text-[#0d0d0d] px-4 py-2.5 rounded-[12px] text-[12px] font-black transition-all hover:scale-105"
                                        >
                                            EKLE
                                        </button>
                                    </div>
                                    <ul className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
                                        {floors.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-center gap-1.5 bg-[#0d0d0d] rounded-[10px] pl-3 pr-1 py-1 border border-[#27272a]"
                                            >
                                                <span className="text-[11px] font-black text-white italic uppercase">{f}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFloor(f)}
                                                    className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#71717a] hover:bg-[#3f1515] hover:text-[#ef4444] transition-colors"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all duration-300 mt-2 disabled:opacity-50 uppercase tracking-widest"
                            >
                                {submitting ? <Loader2 className="animate-spin inline mr-2" /> : "MASAYI OLUŞTUR"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sağ: Masa kartları */}
                <div className="flex-1 w-full flex flex-col gap-6">
                    {/* Kat Filtreleme Chips */}
                    <div className="flex flex-wrap items-center gap-3 bg-[#1c1c1c] p-3 rounded-[24px] border border-[#27272a]/50">
                        <span className="text-[10px] font-black text-[#71717a] uppercase tracking-[0.2em] ml-2 mr-1">KAT FİLTRESİ:</span>
                        {floorOptions.map((f) => (
                            <button
                                key={f}
                                onClick={() => setSelectedFloor(f)}
                                className={`px-5 py-2.5 rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all ${selectedFloor === f
                                    ? "bg-[#eab308] text-[#0d0d0d] shadow-[0_5px_15px_rgba(234,179,8,0.3)]"
                                    : "bg-[#0d0d0d] text-[#a1a1aa] hover:text-white border border-[#27272a]"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="w-full h-[400px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#eab308]" size={48} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {filteredTables.map((table) => {
                                const isOccupied = table.status === "OCCUPIED";
                                return (
                                    <div
                                        key={table.id}
                                        className={`bg-[#1c1c1c] border-2 rounded-[24px] p-5 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 relative group ${isOccupied ? "border-[#ef4444]/60 shadow-[0_10px_30px_rgba(239,68,68,0.15)]" : "border-[#27272a] hover:border-[#eab308]/40"
                                            }`}
                                    >
                                        {/* Name and Floor Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col">
                                                <h3 className={`text-2xl font-black leading-none ${isOccupied ? "text-[#ef4444]" : "text-[#22c55e]"}`}>
                                                    {table.name}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-40">
                                                <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">
                                                    {table.floor}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Capacity Info */}
                                        <div className="flex items-center gap-2 text-[#a1a1aa]">
                                            <Users size={15} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                {table.capacity} KİŞİLİK
                                            </span>
                                        </div>

                                        {/* Status / Amount Display */}
                                        <div className="flex items-center gap-3 mt-auto pt-3 border-t border-[#27272a]">
                                            <Banknote size={18} className={isOccupied ? "text-white" : "text-[#71717a]"} />
                                            <span className={`text-[17px] font-black tracking-tight ${isOccupied ? "text-white" : "text-[#71717a] opacity-50 uppercase"}`}>
                                                {isOccupied ? `${table.current_remaining_amount || 0}₺` : "BOŞ"}
                                            </span>
                                        </div>

                                        {/* Delete Action (Hidden by default, shown on hover) */}
                                        <button
                                            onClick={() => handleDeleteTable(table.id)}
                                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-[#3f1515] text-[#ef4444] border border-[#ef4444]/20 flex items-center justify-center transition-all hover:scale-110 shadow-lg z-10"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

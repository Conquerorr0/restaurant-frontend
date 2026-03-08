"use client";

import React, { useState, useEffect } from "react";
import { LayoutGrid, Users, Banknote, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tableService, Table } from "@/services/tableService";

export default function TableManagement() {
    const { token } = useAuth();
    const [tableName, setTableName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [floor, setFloor] = useState("");
    const [floors, setFloors] = useState<string[]>([]);
    const [newFloorName, setNewFloorName] = useState("");
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

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

    const handleAddFloor = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newFloorName.trim();
        if (!name || floors.includes(name)) return;
        setFloors((prev) => [...prev, name].sort());
        setNewFloorName("");
    };

    const handleRemoveFloor = (floorName: string) => {
        const tableCount = tables.filter((t) => t.floor === floorName).length;
        if (tableCount > 0 && !confirm(`"${floorName}" katında ${tableCount} masa var. Yine de bu katı kaldırmak istiyor musunuz?`)) return;
        setFloors((prev) => prev.filter((f) => f !== floorName));
        if (floor === floorName) setFloor("");
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
        if (!confirm("Bu masayı silmek istediğinize emin misiniz?")) return;
        try {
            const res = await tableService.deleteTable(id, token!);
            if (res.success) {
                setTables(prev => prev.filter(t => t.id !== id));
            }
        } catch (err: any) {
            alert(err.message || "Silme işlemi başarısız");
        }
    };

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-md">
                    MASA YÖNETİMİ
                </h1>
                <p className="text-[#808080] text-[15px] font-medium tracking-wide">
                    İşletme yerleşim planını düzenleyin
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sol: Yeni Masa Ekle */}
                <div className="w-full lg:w-[380px] flex-shrink-0 bg-[#1c1c1c] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
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

                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">
                                    MASA ADI
                                </label>
                                <input
                                    type="text"
                                    placeholder="Örn: Bahçe-1, Masa-2"
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium border border-transparent hover:border-[#27272a]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">
                                    KAPASİTE (KİŞİ)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="Örn: 4"
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                        className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium border border-transparent hover:border-[#27272a]"
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
                                        value={floor}
                                        onChange={(e) => setFloor(e.target.value)}
                                        className="bg-[#0d0d0d] text-white px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium appearance-none border border-transparent hover:border-[#27272a]"
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
                                <div className="mt-3 pt-3 border-t border-[#27272a]">
                                    <p className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider mb-2">Kat ekle / kaldır</p>
                                    <form onSubmit={handleAddFloor} className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Yeni kat adı"
                                            value={newFloorName}
                                            onChange={(e) => setNewFloorName(e.target.value)}
                                            className="flex-1 bg-[#0d0d0d] text-white placeholder-[#52525b] px-3 py-2.5 rounded-[12px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 border border-transparent hover:border-[#27272a]"
                                        />
                                        <button
                                            type="submit"
                                            className="flex items-center gap-1.5 bg-[#27272a] text-[#eab308] hover:bg-[#eab308] hover:text-[#0d0d0d] px-3 py-2.5 rounded-[12px] text-[12px] font-bold transition-colors"
                                        >
                                            <Plus size={14} /> Ekle
                                        </button>
                                    </form>
                                    <ul className="flex flex-wrap gap-2">
                                        {floors.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-center gap-1.5 bg-[#0d0d0d] rounded-[10px] pl-2.5 pr-1.5 py-1.5 border border-[#27272a]"
                                            >
                                                <span className="text-[12px] font-medium text-white">{f}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFloor(f)}
                                                    className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#a1a1aa] hover:bg-[#3f1515] hover:text-[#ef4444] transition-colors"
                                                    title="Katı kaldır"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleAddTable}
                                className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all duration-300 mt-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin inline mr-2" /> : "MASA EKLE"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sağ: Masa kartları */}
                <div className="flex-1 w-full flex flex-col gap-6">
                    {loading ? (
                        <div className="w-full h-[300px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#eab308]" size={48} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {tables.map((table) => {
                                const isOccupied = table.status === "OCCUPIED";
                                return (
                                    <div
                                        key={table.id}
                                        className="bg-[#1c1c1c] border border-transparent hover:border-[#eab308]/30 rounded-[24px] p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <span
                                                className="text-xl font-black tracking-wide uppercase italic"
                                                style={{ color: isOccupied ? "#ef4444" : "#22c55e" }}
                                            >
                                                {table.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
                                                    {table.floor}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTable(table.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-[#71717a] hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#a1a1aa]">
                                            <Users size={14} />
                                            <span className="text-[12px] font-black uppercase tracking-widest">
                                                {table.capacity} KİŞİLİK
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Banknote size={14} className="text-[#eab308]" />
                                            <span className="text-[15px] font-black text-white italic">
                                                {isOccupied ? `${table.current_remaining_amount || 0}₺` : "BOŞ"}
                                            </span>
                                        </div>
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

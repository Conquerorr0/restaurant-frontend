"use client";

import React, { useState, useEffect } from "react";
import {
    Plus, Search, Edit2, Trash2, X, Check,
    LayoutGrid, Users, Layers, Loader2, AlertCircle, Banknote
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tableService } from "@/services/tableService";

export default function TableManagement() {
    const { token } = useAuth();
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState<any>(null);
    const [formData, setFormData] = useState<{
        name: string;
        capacity: number;
        floor: string;
        status: "EMPTY" | "OCCUPIED"
    }>({
        name: "",
        capacity: 4,
        floor: "Zemin Kat",
        status: "EMPTY"
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token) fetchTables();
    }, [token]);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const res = await tableService.getTables(token!);
            if (res.success) setTables(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingTable(null);
        setFormData({
            name: "",
            capacity: 4,
            floor: floors[0] || "Zemin Kat",
            status: "EMPTY"
        });
        setError("");
        setShowModal(true);
    };

    const handleOpenEdit = (table: any) => {
        setEditingTable(table);
        setFormData({
            name: table.name,
            capacity: table.capacity,
            floor: table.floor,
            status: table.status
        });
        setError("");
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (editingTable) {
                const res = await tableService.updateTable(editingTable.id, formData, token!);
                if (res.success) {
                    setShowModal(false);
                    fetchTables();
                }
            } else {
                const res = await tableService.createTable(formData, token!);
                if (res.success) {
                    setShowModal(false);
                    fetchTables();
                }
            }
        } catch (err: any) {
            setError(err.message || "İşlem başarısız");
        } finally {
            setSubmitting(false);
        }
    };

    // Group tables by floor
    const floors = Array.from(new Set(tables.map(t => t.floor))).sort();

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header section with new design */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-md italic">MASA YÖNETİMİ</h1>
                    <p className="text-[#808080] text-[15px] font-medium tracking-wide">
                        Restoran yerleşimini ve masa kapasitelerini düzenleyin
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-[#eab308] text-[#0d0d0d] px-8 py-4 rounded-[20px] font-black flex items-center gap-3 hover:scale-[1.05] transition-all shadow-[0_10px_30px_rgba(234,179,8,0.2)]"
                >
                    <Plus size={22} strokeWidth={3} />
                    YENİ MASA EKLE
                </button>
            </div>

            {/* List by Floor with new premium design */}
            {loading ? (
                <div className="w-full h-[400px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#eab308]" size={40} />
                </div>
            ) : (
                <div className="flex flex-col gap-12">
                    {floors.length === 0 && (
                        <div className="bg-[#18181b] border border-[#27272a] rounded-[32px] p-20 flex flex-col items-center justify-center gap-6 text-[#71717a]">
                            <LayoutGrid size={64} className="opacity-10" />
                            <p className="font-bold text-xl uppercase tracking-widest">Henüz masa eklenmemiş</p>
                        </div>
                    )}

                    {floors.map(floor => (
                        <div key={floor} className="flex flex-col gap-8">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#eab308]/10 flex items-center justify-center text-[#eab308]">
                                    <Layers size={22} />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">{floor}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-[#27272a] to-transparent"></div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {tables.filter(t => t.floor === floor).map(table => {
                                    const isOccupied = table.status === "OCCUPIED";
                                    return (
                                        <div
                                            key={table.id}
                                            className="bg-[#1c1c1c] border border-transparent hover:border-[#eab308]/30 rounded-[28px] p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative group"
                                        >
                                            <div className="flex items-start justify-between relative z-10">
                                                <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-white font-black text-lg ${isOccupied ? 'bg-red-500/20 text-red-500' : 'bg-[#27272a] shadow-inner'}`}>
                                                    {table.name}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(table)}
                                                        className="p-2 bg-[#27272a] hover:text-[#eab308] rounded-xl transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(table.id)}
                                                        className="p-2 bg-[#27272a] hover:text-red-500 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1 relative z-10">
                                                <div className="flex items-center gap-2 text-[#71717a] text-[11px] font-black uppercase tracking-wider">
                                                    <Users size={14} />
                                                    <span>{table.capacity} Kişilik</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white font-black text-lg">
                                                    <Banknote size={16} className="text-[#eab308]" />
                                                    <span>{isOccupied ? `${table.current_remaining_amount || 0}₺` : "BOŞ"}</span>
                                                </div>
                                            </div>

                                            <div className={`mt-2 text-[10px] font-black px-3 py-1.5 rounded-xl text-center tracking-widest relative z-10 ${isOccupied ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                }`}>
                                                {isOccupied ? 'DOLU' : 'TEMİZ / BOŞ'}
                                            </div>

                                            {/* Decoration */}
                                            <div className="absolute -right-4 -bottom-4 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                                                <LayoutGrid size={100} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1c1c1c] border border-[#27272a] w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-10 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white italic truncate pr-4">
                                {editingTable ? `Masa ${editingTable.name} Düzenle` : 'YENİ MASA EKLE'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-[#27272a] text-[#71717a] hover:text-white flex items-center justify-center transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 pt-4 flex flex-col gap-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-5 rounded-[24px] text-sm font-bold flex items-center gap-4 animate-shake">
                                    <AlertCircle size={20} /> {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-[0.2em] ml-2 uppercase">MASA ADI / NO</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[20px] py-4 px-6 text-white font-bold focus:border-[#eab308] outline-none transition-all"
                                    placeholder="Örn: A1, B3, Teras-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-[0.2em] ml-2 uppercase">KAT / BÖLÜM</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[20px] py-4 px-6 text-white font-bold focus:border-[#eab308] outline-none transition-all"
                                    placeholder="Örn: Zemin Kat, Teras, Bahçe"
                                    value={formData.floor}
                                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-[0.2em] ml-2 uppercase">KAPASİTE (KİŞİ)</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[2, 4, 6, 8].map(cap => (
                                        <button
                                            key={cap}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, capacity: cap })}
                                            className={`py-4 rounded-[16px] font-black transition-all ${formData.capacity === cap ? 'bg-[#eab308] text-[#0d0d0d] shadow-lg shadow-[#eab308]/20' : 'bg-[#0d0d0d] text-[#71717a] border border-[#27272a]'
                                                }`}
                                        >
                                            {cap}
                                        </button>
                                    ))}
                                    <input
                                        type="number"
                                        className="col-span-4 bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-4 px-4 text-white text-center font-black placeholder-[#27272a]"
                                        placeholder="Kapasite giriniz..."
                                        min={1}
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] py-5 rounded-[24px] text-[#0d0d0d] font-black text-xl mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl shadow-[#eab308]/10"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={28} /> : <><Check size={28} strokeWidth={4} /> {editingTable ? 'DEĞİŞİKLİKLERİ KAYDET' : 'MASAYI SİSTEME EKLE'}</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

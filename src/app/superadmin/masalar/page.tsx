"use client";

import React, { useState, useEffect } from "react";
import {
    Home, Plus, Search, Edit2, Trash2, X, Check,
    Grid, Users, Layers, Loader2, AlertCircle
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
            floor: "Zemin Kat",
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
        <div className="flex flex-col gap-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-wide mb-1">MASA YÖNETİMİ</h1>
                    <p className="text-[#a1a1aa] text-[15px] font-medium font-bold">
                        Restoran yerleşimini ve masa kapasitelerini düzenleyin
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-[#eab308] text-[#0d0d0d] px-6 py-3 rounded-[16px] font-black flex items-center gap-2 hover:scale-[1.05] transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                >
                    <Plus size={20} />
                    YENİ MASA EKLE
                </button>
            </div>

            {/* List by Floor */}
            {loading ? (
                <div className="w-full h-[400px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#eab308]" size={40} />
                </div>
            ) : (
                <div className="flex flex-col gap-10">
                    {floors.length === 0 && (
                        <div className="bg-[#18181b] border border-[#27272a] rounded-[24px] p-12 flex flex-col items-center justify-center gap-4 text-[#71717a]">
                            <Grid size={48} className="opacity-20" />
                            <p className="font-bold">Henüz masa eklenmemiş</p>
                        </div>
                    )}

                    {floors.map(floor => (
                        <div key={floor} className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <Layers size={20} className="text-[#eab308]" />
                                <h2 className="text-xl font-black text-white uppercase tracking-widest">{floor}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-[#27272a] to-transparent"></div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {tables.filter(t => t.floor === floor).map(table => (
                                    <div
                                        key={table.id}
                                        className="bg-[#18181b] border border-[#27272a] rounded-[20px] p-4 flex flex-col gap-4 group transition-all hover:border-[#eab308]/50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="w-10 h-10 rounded-[12px] bg-[#27272a] flex items-center justify-center text-white font-black">
                                                {table.name}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(table)}
                                                    className="p-1.5 bg-[#27272a] hover:text-[#eab308] rounded-md transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(table.id)}
                                                    className="p-1.5 bg-[#27272a] hover:text-red-500 rounded-md transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-[#71717a] text-xs font-bold">
                                            <Users size={14} />
                                            <span>{table.capacity} Kişilik</span>
                                        </div>

                                        <div className={`mt-auto text-[10px] font-black px-2 py-1 rounded-md text-center ${table.status === 'OCCUPIED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                            }`}>
                                            {table.status === 'OCCUPIED' ? 'DOLU' : 'BOŞ'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#18181b] border border-[#27272a] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white italic">
                                {editingTable ? 'MASA DÜZENLE' : 'YENİ MASA'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-[#71717a] hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 pt-4 flex flex-col gap-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-sm font-bold flex items-center gap-3">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest ml-1 uppercase">MASA ADI</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 text-white font-bold focus:border-[#eab308] outline-none"
                                        placeholder="Örn: A1, B3, Bahçe-1"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest ml-1 uppercase">KAT / BÖLÜM</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 text-white font-bold focus:border-[#eab308] outline-none"
                                    placeholder="Örn: Zemin Kat, Teras, Bahçe"
                                    value={formData.floor}
                                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest ml-1 uppercase">KAPASİTE</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[2, 4, 6, 8].map(cap => (
                                        <button
                                            key={cap}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, capacity: cap })}
                                            className={`py-3 rounded-[12px] font-black transition-all ${formData.capacity === cap ? 'bg-[#eab308] text-[#0d0d0d]' : 'bg-[#0d0d0d] text-[#71717a] border border-[#27272a]'
                                                }`}
                                        >
                                            {cap}
                                        </button>
                                    ))}
                                    <input
                                        type="number"
                                        className="col-span-4 bg-[#0d0d0d] border border-[#27272a] rounded-[12px] py-2 px-4 text-white text-center font-bold"
                                        placeholder="Daha fazla..."
                                        min={1}
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#eab308] py-4 rounded-[18px] text-[#0d0d0d] font-black text-lg mt-4 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> {editingTable ? 'GÜNCELLE' : 'EKLE'}</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

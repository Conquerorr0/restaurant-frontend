"use client";

import React, { useState, useEffect } from "react";
import { LayoutGrid, Users, Banknote, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { tableService, Table } from "@/services/tableService";
import { useTranslations } from "next-intl";

export default function TableManagement() {
    const t = useTranslations("SuperAdmin");
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

    const [selectedFloor, setSelectedFloor] = useState<string>(t("all"));
    // Wait, "all" is in Garson/Kasa namespace. I should add a Common namespace or add it to SuperAdmin.
    // Actually, "all" is in Garson and Kasa. Let's use Garson's "all" or just use local "all".
    // I'll add "all": "Tümü" to SuperAdmin namespace as well to be safe or use what I have.
    // I already added "all": "All" to SuperAdmin in my thought but I didn't write it to file?
    // Let me check my previous write_to_file calls.
    // Ah, I didn't add "all" to SuperAdmin. Let me add it.

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
            setError(t("error_general", { defaultValue: "Masalar yüklenirken bir hata oluştu." }));
        } finally {
            setLoading(false);
        }
    };

    // Filter tables by building the list of unique floors + "Tümü"
    const floorOptions = [t("all"), ...floors];
    const filteredTables = selectedFloor === t("all")
        ? tables
        : tables.filter(tbl => tbl.floor === selectedFloor);

    const handleAddFloor = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newFloorName.trim();
        if (!name || floors.includes(name)) return;
        setFloors((prev) => [...prev, name].sort());
        setNewFloorName("");
    };

    const handleRemoveFloor = async (floorName: string) => {
        const tableCount = tables.filter((tbl) => tbl.floor === floorName).length;
        if (tableCount > 0 && !(await showConfirm(t("floor_delete_confirm", { floor: floorName, count: tableCount }), t("floor_delete_title")))) return;
        setFloors((prev) => prev.filter((f) => f !== floorName));
        if (floor === floorName) setFloor("");
        if (selectedFloor === floorName) setSelectedFloor(t("all")); // Reset filter if current floor is removed
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
            setError(err.message || t("error_general", { defaultValue: "Masa eklenirken hata oluştu." }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!(await showConfirm(t("table_delete_confirm"), t("table_delete_title")))) return;
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
                <h1 className="text-3xl font-black text-[var(--foreground)] tracking-widest uppercase mb-1 drop-shadow-md italic">
                    {t("table_management")}
                </h1>
                <p className="text-[var(--muted)] text-[15px] font-medium tracking-wide">
                    {t("layout_subtitle")}
                </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start">
                {/* Sol: Yeni Masa Ekle */}
                <div className="w-full xl:w-[380px] flex-shrink-0 bg-[var(--card)] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group border border-[var(--border)]/50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308]/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none transition-all duration-500 group-hover:bg-[#eab308]/10" />
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <LayoutGrid size={24} className="text-[#eab308]" />
                            <h2 className="text-xl font-black text-[var(--foreground)] tracking-wide uppercase italic">
                                {submitting ? t("adding_table") : t("add_new_table")}
                            </h2>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-sm font-bold flex items-center gap-3">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleAddTable} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em]">
                                    {t("table_name")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("table_name_placeholder")}
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold border border-transparent hover:border-[var(--border)]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em]">
                                    {t("capacity_person")}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        placeholder={t("capacity_placeholder")}
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                        className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold border border-transparent hover:border-[var(--border)]"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                                        <Users size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em]">
                                    {t("floor")}
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={floor}
                                        onChange={(e) => setFloor(e.target.value)}
                                        className="bg-[var(--background)] text-[var(--foreground)] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold appearance-none border border-transparent hover:border-[var(--border)]"
                                    >
                                        <option value="" disabled className="text-[var(--muted)]">
                                            {t("select_floor")}
                                        </option>
                                        {floors.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[var(--muted)]" />
                                    </div>
                                </div>
                                {/* Kat ekle / kaldır */}
                                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                    <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider mb-2">{t("floor_list_management")}</p>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder={t("new_floor_placeholder")}
                                            value={newFloorName}
                                            onChange={(e) => setNewFloorName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFloor(e as any))}
                                            className="flex-1 bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] px-4 py-2.5 rounded-[12px] text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 border border-transparent hover:border-[var(--border)]"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddFloor as any}
                                            className="bg-[#eab308] text-[var(--background)] px-4 py-2.5 rounded-[12px] text-[12px] font-black transition-all hover:scale-105"
                                        >
                                            {t("add_floor")}
                                        </button>
                                    </div>
                                    <ul className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
                                        {floors.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-center gap-1.5 bg-[var(--background)] rounded-[10px] pl-3 pr-1 py-1 border border-[var(--border)]"
                                            >
                                                <span className="text-[11px] font-black text-[var(--foreground)] italic uppercase">{f}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFloor(f)}
                                                    className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--muted)] hover:bg-[#3f1515] hover:text-[#ef4444] transition-colors"
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
                                className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] text-[var(--background)] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all duration-300 mt-2 disabled:opacity-50 uppercase tracking-widest"
                            >
                                {submitting ? <Loader2 className="animate-spin inline mr-2" /> : t("create_table")}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sağ: Masa kartları */}
                <div className="flex-1 w-full flex flex-col gap-6">
                    {/* Kat Filtreleme Chips */}
                    <div className="flex flex-wrap items-center gap-3 bg-[var(--card)] p-3 rounded-[24px] border border-[var(--border)]/50">
                        <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] ml-2 mr-1">{t("floor_filter")}</span>
                        {floorOptions.map((f) => (
                            <button
                                key={f}
                                onClick={() => setSelectedFloor(f)}
                                className={`px-5 py-2.5 rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all ${selectedFloor === f
                                    ? "bg-[#eab308] text-[var(--background)] shadow-[0_5px_15px_rgba(234,179,8,0.3)]"
                                    : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
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
                                        className={`bg-[var(--card)] border-2 rounded-[24px] p-5 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 relative group ${isOccupied ? "border-[#ef4444]/60 shadow-[0_10px_30px_rgba(239,68,68,0.15)]" : "border-[var(--border)] hover:border-[#eab308]/40"
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
                                                <span className="text-[10px] font-black text-[var(--foreground)] uppercase tracking-[0.15em]">
                                                    {table.floor}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Capacity Info */}
                                        <div className="flex items-center gap-2 text-[var(--muted)]">
                                            <Users size={15} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                {t("person_count", { count: table.capacity })}
                                            </span>
                                        </div>

                                        {/* Status / Amount Display */}
                                        <div className="flex items-center gap-3 mt-auto pt-3 border-t border-[var(--border)]">
                                            <Banknote size={18} className={isOccupied ? "text-[var(--foreground)]" : "text-[var(--muted)]"} />
                                            <span className={`text-[17px] font-black tracking-tight ${isOccupied ? "text-[var(--foreground)]" : "text-[var(--muted)] opacity-50 uppercase"}`}>
                                                {isOccupied ? `${table.current_remaining_amount || 0}₺` : t("empty_status")}
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

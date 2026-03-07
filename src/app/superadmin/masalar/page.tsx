"use client";

import React, { useState } from "react";
import { LayoutGrid, Users, Banknote, Plus, Trash2 } from "lucide-react";

// API ile uyumlu mock tipi (GET /tables, GET /tables/by-floor)
type TableStatus = "EMPTY" | "OCCUPIED";

interface MockTable {
    id: string;
    name: string;
    status: TableStatus;
    capacity: number;
    floor: string;
    current_remaining_amount: number;
}

// Başlangıç kat listesi (eklenip çıkarılabilir)
const INITIAL_FLOORS = ["Kat 1", "Kat 2", "Bahçe"];

// Mock masalar (API response formatında)
const MOCK_TABLES: MockTable[] = [
    { id: "1", name: "A1", status: "OCCUPIED", capacity: 4, floor: "Kat 1", current_remaining_amount: 580 },
    { id: "2", name: "A2", status: "EMPTY", capacity: 2, floor: "Kat 1", current_remaining_amount: 0 },
    { id: "3", name: "A3", status: "EMPTY", capacity: 2, floor: "Kat 1", current_remaining_amount: 0 },
    { id: "4", name: "B1", status: "OCCUPIED", capacity: 6, floor: "Kat 1", current_remaining_amount: 1410 },
    { id: "5", name: "B2", status: "EMPTY", capacity: 4, floor: "Kat 2", current_remaining_amount: 0 },
    { id: "6", name: "B3", status: "EMPTY", capacity: 4, floor: "Kat 2", current_remaining_amount: 0 },
    { id: "7", name: "T1", status: "EMPTY", capacity: 10, floor: "Bahçe", current_remaining_amount: 0 },
    { id: "8", name: "T2", status: "OCCUPIED", capacity: 10, floor: "Bahçe", current_remaining_amount: 1000 },
];

export default function TableManagement() {
    const [tableName, setTableName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [floor, setFloor] = useState("");
    const [floors, setFloors] = useState<string[]>(INITIAL_FLOORS);
    const [newFloorName, setNewFloorName] = useState("");
    const [tables, setTables] = useState<MockTable[]>(MOCK_TABLES);

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

    const handleAddTable = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock: sadece UI. Backend entegrasyonunda tableService/create çağrılacak.
        if (!tableName.trim() || !capacity.trim() || !floor) return;
        const num = parseInt(capacity, 10);
        if (Number.isNaN(num) || num < 1) return;
        const newTable: MockTable = {
            id: String(Date.now()),
            name: tableName.trim(),
            status: "EMPTY",
            capacity: num,
            floor,
            current_remaining_amount: 0,
        };
        setTables((prev) => [...prev, newTable]);
        setTableName("");
        setCapacity("");
        setFloor("");
    };

    // İleride kat filtresi eklenecekse: tables.filter(t => t.floor === selectedFloor)
    const displayedTables = tables;

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
                            <h2 className="text-xl font-black text-white tracking-wide">+ YENİ MASA EKLE</h2>
                        </div>

                        <form onSubmit={handleAddTable} className="flex flex-col gap-5">
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
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all duration-300 mt-2"
                            >
                                MASA EKLE
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sağ: Masa kartları */}
                <div className="flex-1 w-full flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {displayedTables.map((table) => {
                            const isOccupied = table.status === "OCCUPIED";
                            return (
                                <div
                                    key={table.id}
                                    className="bg-[#1c1c1c] border border-transparent hover:border-[#eab308]/30 rounded-[24px] p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                >
                                    <div className="flex items-start justify-between">
                                        <span
                                            className="text-xl font-black tracking-wide"
                                            style={{ color: isOccupied ? "#ef4444" : "#22c55e" }}
                                        >
                                            {table.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
                                            {table.floor}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[#a1a1aa]">
                                        <Users size={14} />
                                        <span className="text-[12px] font-bold uppercase tracking-wide">
                                            {table.capacity} KİŞİLİK
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Banknote size={14} className="text-[#71717a]" />
                                        <span className="text-[15px] font-black text-white">
                                            {isOccupied ? `${table.current_remaining_amount}₺` : "BOŞ"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

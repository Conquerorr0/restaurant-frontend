"use client";

import React, { useState } from "react";
import { UserPlus, User, Lock, Edit2, Trash2, Settings, X, Save } from "lucide-react";

type RoleType = "SUPER_ADMIN" | "CASHIER" | "WAITER";

interface MockPerson {
    id: string;
    name: string;
    role: RoleType;
    pin: string | null;
}

const MOCK_PEOPLE: MockPerson[] = [
    { id: "1", name: "Fatih Altuntaş", role: "SUPER_ADMIN", pin: null },
    { id: "2", name: "Mehmet Kasa", role: "CASHIER", pin: null },
    { id: "3", name: "Ali Garson", role: "WAITER", pin: "1234" },
];

const getRoleDisplay = (role: RoleType) => {
    switch (role) {
        case "SUPER_ADMIN": return { label: "SUPER_ADMIN", color: "text-[#eab308]", bg: "bg-[#eab308]/10" };
        case "CASHIER": return { label: "CASHIER", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" };
        case "WAITER": return { label: "WAITER", color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" };
    }
};

export default function PersonnelManagement() {
    const [name, setName] = useState("");
    const [role, setRole] = useState<RoleType | "">("");
    const [pin, setPin] = useState("");
    const [people, setPeople] = useState<MockPerson[]>(MOCK_PEOPLE);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAddOrEditPerson = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !role) return;

        if (editingId) {
            setPeople(people.map(p => p.id === editingId ? {
                ...p,
                name: name.trim(),
                role: role as RoleType,
                pin: pin.trim() || null
            } : p));
            setEditingId(null);
        } else {
            const newPerson: MockPerson = {
                id: String(Date.now()),
                name: name.trim(),
                role: role as RoleType,
                pin: pin.trim() || null,
            };
            setPeople([...people, newPerson]);
        }

        setName("");
        setRole("");
        setPin("");
    };

    const handleEditClick = (person: MockPerson) => {
        setEditingId(person.id);
        setName(person.name);
        setRole(person.role);
        setPin(person.pin || "");

        // Form alanına yumuşak scroll (kullanıcı deneyimi için)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName("");
        setRole("");
        setPin("");
    };

    const handleDelete = (id: string) => {
        if (confirm("Bu personeli silmek istediğinize emin misiniz?")) {
            setPeople(people.filter(p => p.id !== id));
        }
    };

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-md">
                    PERSONEL YÖNETİMİ
                </h1>
                <p className="text-[#808080] text-[15px] font-medium tracking-wide">
                    Ekip üyelerini ve erişim yetkilerini düzenleyin
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sol: Yeni Personel Formu */}
                <div className="w-full lg:w-[420px] flex-shrink-0 bg-[#1c1c1c] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308]/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none transition-all duration-500 group-hover:bg-[#eab308]/10" />

                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {editingId ? (
                                    <Edit2 size={24} className="text-[#eab308]" />
                                ) : (
                                    <UserPlus size={24} className="text-[#eab308]" />
                                )}
                                <h2 className="text-xl font-black text-white tracking-wide">
                                    {editingId ? "PERSONELİ DÜZENLE" : "YENİ PERSONEL"}
                                </h2>
                            </div>
                            {editingId && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-2 text-[#a1a1aa] hover:text-[#ef4444] transition-colors rounded-full hover:bg-[#3f1515]/50 flex items-center justify-center title='İptal Et'"
                                    title="Düzenlemeyi İptal Et"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleAddOrEditPerson} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">
                                    AD SOYAD
                                </label>
                                <input
                                    type="text"
                                    placeholder="Örn: Ahmet Yılmaz"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium border border-transparent hover:border-[#27272a]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">
                                        ROL
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as RoleType)}
                                            className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-4 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium appearance-none border border-transparent hover:border-[#27272a]"
                                        >
                                            <option value="" disabled className="text-[#52525b]">Seçiniz</option>
                                            <option value="SUPER_ADMIN">Süper Admin</option>
                                            <option value="CASHIER">Kasiyer</option>
                                            <option value="WAITER">Garson</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#a1a1aa]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em] leading-tight truncate" title="GİRİŞ KODU (PİN/ŞİFRE)">
                                        GİRİŞ KODU<br /><span className="text-[9px] text-[#52525b]">(PİN/ŞİFRE)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Örn: 1234"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-4 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium border border-transparent hover:border-[#27272a]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all duration-300 mt-2 tracking-wide"
                            >
                                {editingId ? (
                                    <>
                                        <Save size={20} />
                                        GÜNCELLE
                                    </>
                                ) : (
                                    <>PERSONELİ KAYDET</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sağ: Personel Listesi */}
                <div className="flex-1 w-full flex flex-col gap-4">
                    {people.map((person) => {
                        const style = getRoleDisplay(person.role);
                        return (
                            <div
                                key={person.id}
                                className="bg-[#1c1c1c] border border-transparent hover:border-[#eab308]/30 rounded-[24px] p-5 flex items-center justify-between transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-[#2a2a2a] rounded-[18px] flex items-center justify-center relative flex-shrink-0">
                                        <User size={24} className="text-[#a1a1aa]" />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1c1c1c] rounded-full flex items-center justify-center">
                                            <Settings size={12} className="text-[#eab308]" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-lg font-black text-white">{person.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-[8px] ${style.color} ${style.bg}`}>
                                                {style.label}
                                            </span>
                                            <span className="text-[#a1a1aa] text-[13px] font-medium flex items-center gap-1.5">
                                                <Lock size={14} className="text-[#71717a]" />
                                                {person.pin ? `PIN: ${person.pin}` : "Şifre Erişimi"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEditClick(person)}
                                        className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-colors ${editingId === person.id
                                                ? "bg-[#eab308] text-[#0d0d0d]"
                                                : "bg-[#2a2a2a] text-[#a1a1aa] hover:bg-[#eab308] hover:text-[#0d0d0d]"
                                            }`}
                                        title="Düzenle"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(person.id)}
                                        className="w-11 h-11 rounded-[14px] bg-[#3f1515] flex items-center justify-center text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

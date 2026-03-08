"use client";

import React, { useState, useEffect } from "react";
import {
    UserPlus, User, Lock, Edit2, Trash2, Settings, X, Save,
    Shield, Key, Loader2, AlertCircle, Search
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userService, User as UserType } from "@/services/userService";

const getRoleDisplay = (role: string) => {
    switch (role) {
        case "SUPER_ADMIN": return { label: "SÜPER ADMİN", color: "text-[#eab308]", bg: "bg-[#eab308]/10", icon: Shield };
        case "CASHIER": return { label: "KASİYER", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", icon: Key };
        case "WAITER": return { label: "GARSON", color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", icon: User };
        default: return { label: role, color: "text-[#a1a1aa]", bg: "bg-[#a1a1aa]/10", icon: User };
    }
};

export default function PersonnelManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingUser, setEditingUser] = useState<UserType | null>(null);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        role: "WAITER",
        pin_code: ""
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getUsers(token!);
            if (res.success) setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user: UserType) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: "",
            name: user.name_surname,
            role: user.role,
            pin_code: user.pin_code || ""
        });
        setError("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setFormData({
            username: "",
            password: "",
            name: "",
            role: "WAITER",
            pin_code: ""
        });
        setError("");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu personeli silmek istediğinize emin misiniz?")) return;
        try {
            const res = await userService.deleteUser(id, token!);
            if (res.success) {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (err: any) {
            alert(err.message || "Silme işlemi başarısız");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.username || (!editingUser && !formData.password && formData.role !== 'WAITER')) {
            setError("Lütfen gerekli alanları doldurun.");
            return;
        }

        setError("");
        setSubmitting(true);

        try {
            if (editingUser) {
                const res = await userService.updateUser(editingUser.id, {
                    username: formData.username,
                    name_surname: formData.name,
                    role: formData.role,
                    pin_code: formData.role === 'WAITER' ? formData.pin_code : null,
                    ...(formData.password ? { password: formData.password } : {})
                }, token!);
                if (res.success) {
                    handleCancelEdit();
                    fetchUsers();
                }
            } else {
                const res = await userService.addUser({
                    username: formData.username,
                    password: formData.password || "123456", // Default if not provided for waiters (though they use PIN)
                    name: formData.name,
                    role: formData.role,
                    pin_code: formData.role === 'WAITER' ? formData.pin_code : null
                }, token!);
                if (res.success) {
                    handleCancelEdit();
                    fetchUsers();
                }
            }
        } catch (err: any) {
            setError(err.message || "İşlem başarısız");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name_surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-md italic">
                        PERSONEL YÖNETİMİ
                    </h1>
                    <p className="text-[#808080] text-[15px] font-medium tracking-wide">
                        Ekip üyelerini ve erişim yetkilerini düzenleyin
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sol: Yeni Personel Formu */}
                <div className="w-full lg:w-[420px] flex-shrink-0 bg-[#1c1c1c] border border-[#27272a] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308]/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none transition-all duration-500 group-hover:bg-[#eab308]/10" />

                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#eab308]/10 flex items-center justify-center text-[#eab308]">
                                    <UserPlus size={22} />
                                </div>
                                <h2 className="text-xl font-black text-white tracking-wide italic uppercase">
                                    {editingUser ? "PERSONELİ DÜZENLE" : "YENİ PERSONEL"}
                                </h2>
                            </div>
                            {editingUser && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="w-8 h-8 rounded-full bg-[#27272a] text-[#a1a1aa] hover:text-white flex items-center justify-center transition-colors"
                                    title="Düzenlemeyi İptal Et"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-[12px] font-bold flex items-center gap-3">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.2em] ml-2">
                                    AD SOYAD
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Ahmet Yılmaz"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-[#0d0d0d] border border-[#27272a] text-white px-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] transition-all font-bold"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.2em] ml-2">
                                    KULLANICI ADI
                                </label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#71717a] font-black">@</span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="bg-[#0d0d0d] border border-[#27272a] text-white pl-10 pr-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.2em] ml-2">
                                        ROL
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="bg-[#0d0d0d] border border-[#27272a] text-white px-4 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] transition-all font-bold appearance-none"
                                        >
                                            <option value="SUPER_ADMIN">Süper Admin</option>
                                            <option value="CASHIER">Kasiyer</option>
                                            <option value="WAITER">Garson</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#71717a]">
                                            <Settings size={14} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.2em] ml-2 leading-tight">
                                        {formData.role === 'WAITER' ? 'PİN KODU' : 'PAROLA'}
                                    </label>
                                    <input
                                        type={formData.role === 'WAITER' ? "text" : "password"}
                                        placeholder={formData.role === 'WAITER' ? "1234" : "****"}
                                        maxLength={formData.role === 'WAITER' ? 4 : undefined}
                                        value={formData.role === 'WAITER' ? formData.pin_code : formData.password}
                                        onChange={(e) => {
                                            if (formData.role === 'WAITER') {
                                                setFormData({ ...formData, pin_code: e.target.value.replace(/[^0-9]/g, '') });
                                            } else {
                                                setFormData({ ...formData, password: e.target.value });
                                            }
                                        }}
                                        className="bg-[#0d0d0d] border border-[#27272a] text-white px-4 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] transition-all font-black tracking-widest"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-5 rounded-[20px] shadow-xl hover:scale-[1.02] transition-all mt-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : (
                                    <>
                                        {editingUser ? <Save size={22} strokeWidth={3} /> : <UserPlus size={22} strokeWidth={3} />}
                                        {editingUser ? "GÜNCELLEMEYİ KAYDET" : "PERSONELİ KAYDET"}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sağ: Personel Listesi */}
                <div className="flex-1 w-full flex flex-col gap-6">
                    {/* Search Field */}
                    <div className="relative text-[#a1a1aa] focus-within:text-white transition-colors w-full group">
                        <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-[#eab308]" />
                        <input
                            type="text"
                            placeholder="Personel ara (isim veya kullanıcı adı)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1c1c1c] border border-[#27272a] text-white placeholder-[#52525b] py-5 pl-16 pr-6 rounded-[24px] focus:outline-none focus:border-[#eab308] transition-all font-bold shadow-lg"
                        />
                    </div>

                    {loading ? (
                        <div className="w-full h-[300px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#eab308]" size={40} />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredUsers.map((person) => {
                                const style = getRoleDisplay(person.role);
                                const Icon = style.icon;
                                return (
                                    <div
                                        key={person.id}
                                        className={`bg-[#1c1c1c] border rounded-[28px] p-6 flex items-center justify-between transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${editingUser?.id === person.id ? 'border-[#eab308] shadow-[0_0_30px_rgba(234,179,8,0.1)]' : 'border-[#27272a] hover:border-[#eab308]/30'}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-[#27272a] rounded-[22px] flex items-center justify-center relative flex-shrink-0 group">
                                                <User size={28} className="text-[#a1a1aa]" />
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0d0d0d] border-2 border-[#1c1c1c] rounded-full flex items-center justify-center">
                                                    <Icon size={14} className={style.color} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl font-black text-white uppercase italic">{person.name_surname}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-[10px] ${style.color} ${style.bg} border border-current opacity-60`}>
                                                        {style.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[#a1a1aa] text-[13px] font-bold">@{person.username}</span>
                                                    <div className="w-1 h-1 bg-[#27272a] rounded-full"></div>
                                                    <span className="text-[#71717a] text-[13px] font-medium flex items-center gap-1.5">
                                                        <Lock size={14} />
                                                        {person.role === 'WAITER' ? `PIN: ${person.pin_code}` : "Şifre Erişimi"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleEditClick(person)}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${editingUser?.id === person.id
                                                    ? "bg-[#eab308] text-[#0d0d0d]"
                                                    : "bg-[#27272a] text-[#a1a1aa] hover:bg-[#eab308] hover:text-[#0d0d0d]"
                                                    }`}
                                                title="Düzenle"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(person.id)}
                                                className="w-12 h-12 rounded-2xl bg-[#3f1515] flex items-center justify-center text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-all shadow-sm"
                                                title="Sil"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredUsers.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-[#18181b] rounded-[40px] border border-[#27272a] border-dashed">
                                    <div className="w-20 h-20 bg-[#27272a] rounded-full flex items-center justify-center mb-6 opacity-40">
                                        <Search size={32} className="text-[#a1a1aa]" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Personel Bulunamadı</h3>
                                    <p className="text-[#71717a] font-bold">Lütfen arama terimini değiştirin veya yeni bir kayıt ekleyin.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

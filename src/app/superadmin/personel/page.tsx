"use client";

import React, { useState, useEffect } from "react";
import {
    Users, Plus, Search, Edit2, Trash2, X, Check,
    Shield, User, Key, UserPlus, Loader2, AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userService, User as UserType } from "@/services/userService";

export default function PersonnelManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "", // name_surname in backend
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

    const handleOpenAdd = () => {
        setEditingUser(null);
        setFormData({
            username: "",
            password: "",
            name: "",
            role: "WAITER",
            pin_code: ""
        });
        setError("");
        setShowModal(true);
    };

    const handleOpenEdit = (user: UserType) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: "", // Keep empty if not changing
            name: user.name_surname,
            role: user.role,
            pin_code: user.pin_code || ""
        });
        setError("");
        setShowModal(true);
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
                    setShowModal(false);
                    fetchUsers();
                }
            } else {
                // Add new
                const res = await userService.addUser({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    role: formData.role,
                    pin_code: formData.role === 'WAITER' ? formData.pin_code : null
                }, token!);
                if (res.success) {
                    setShowModal(false);
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
        <div className="flex flex-col gap-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-wide mb-1">PERSONEL YÖNETİMİ</h1>
                    <p className="text-[#a1a1aa] text-[15px] font-medium font-bold">
                        Sistem kullanıcılarını yönetin ve yetkilendirin
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-[#eab308] text-[#0d0d0d] px-6 py-3 rounded-[16px] font-black flex items-center gap-2 hover:scale-[1.05] transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                >
                    <UserPlus size={20} />
                    YENİ PERSONEL EKLE
                </button>
            </div>

            {/* Search and Filters */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a]" size={20} />
                <input
                    type="text"
                    placeholder="Personel adı veya kullanıcı adı ile ara..."
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-[20px] py-4 pl-12 pr-4 text-white font-bold focus:border-[#eab308] outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="w-full h-[400px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#eab308]" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className="bg-[#18181b] border border-[#27272a] rounded-[24px] p-6 flex flex-col gap-6 hover:border-[#eab308]/30 transition-all group relative overflow-hidden"
                        >
                            {/* Role Badge */}
                            <div className="absolute top-0 right-0 px-4 py-2 bg-[#27272a] rounded-bl-[16px] flex items-center gap-2">
                                <Shield size={14} className={
                                    user.role === 'SUPER_ADMIN' ? 'text-purple-500' :
                                        user.role === 'CASHIER' ? 'text-blue-500' : 'text-green-500'
                                } />
                                <span className="text-[10px] font-black text-[#a1a1aa] tracking-widest uppercase">
                                    {user.role}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-[18px] bg-[#27272a] flex items-center justify-center text-[#eab308] font-black text-xl">
                                    {user.name_surname.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-lg">{user.name_surname}</h3>
                                    <p className="text-[#71717a] text-sm font-bold">@{user.username}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#71717a] font-bold">Kayıt Tarihi:</span>
                                    <span className="text-[#a1a1aa] font-bold">
                                        {new Date(user.created_at || "").toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                {user.role === 'WAITER' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#71717a] font-bold">Giriş PIN:</span>
                                        <span className="text-[#eab308] font-black tracking-widest">{user.pin_code}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-[#27272a]">
                                <button
                                    onClick={() => handleOpenEdit(user)}
                                    className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-white py-2 rounded-[12px] font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <Edit2 size={16} /> Düzenle
                                </button>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="p-2 aspect-square bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-[12px] transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
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
                                {editingUser ? 'PERSONEL DÜZENLE' : 'YENİ PERSONEL'}
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
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest ml-1 uppercase">AD SOYAD</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a]" size={18} />
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 pl-12 pr-4 text-white font-bold focus:border-[#eab308] outline-none"
                                        placeholder="Görünen İsim"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest ml-1 uppercase">KULLANICI ADI</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] font-black">@</span>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 pl-10 pr-4 text-white font-bold focus:border-[#eab308] outline-none"
                                        placeholder="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black text-[#71717a] tracking-widest ml-1 uppercase">ROL</label>
                                    <select
                                        className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 text-white font-bold focus:border-[#eab308] outline-none appearance-none"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    >
                                        <option value="WAITER">GARSON</option>
                                        <option value="CASHIER">KASİYER</option>
                                        <option value="SUPER_ADMIN">ADMİN</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black text-[#71717a] tracking-widest ml-1 uppercase">
                                        {formData.role === 'WAITER' ? 'PIN KODU' : 'PAROLA'}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a]" size={18} />
                                        <input
                                            required={!editingUser}
                                            type={formData.role === 'WAITER' ? "text" : "password"}
                                            maxLength={formData.role === 'WAITER' ? 4 : undefined}
                                            className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 pl-12 pr-4 text-white font-bold focus:border-[#eab308] outline-none"
                                            placeholder={editingUser ? "Değiştirmek için yazın" : (formData.role === 'WAITER' ? "4 Haneli" : "****")}
                                            value={formData.role === 'WAITER' ? formData.pin_code : formData.password}
                                            onChange={(e) => {
                                                if (formData.role === 'WAITER') {
                                                    setFormData({ ...formData, pin_code: e.target.value.replace(/[^0-9]/g, '') });
                                                } else {
                                                    setFormData({ ...formData, password: e.target.value });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#eab308] py-4 rounded-[18px] text-[#0d0d0d] font-black text-lg mt-4 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> {editingUser ? 'GÜNCELLE' : 'EKLE'}</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

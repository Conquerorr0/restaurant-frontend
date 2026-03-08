"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, User, Lock, Edit2, Trash2, Settings, X, Save, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { userService, User as UserType } from "@/services/userService";
import { useTranslations } from "next-intl";

type RoleType = "SUPER_ADMIN" | "CASHIER" | "WAITER";

// Role display helper moved inside component to access translations

export default function PersonnelManagement() {
    const t = useTranslations("SuperAdmin");
    const { token } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<RoleType | "">("");
    const [pin, setPin] = useState("");

    const [people, setPeople] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    const getRoleDisplay = (role: RoleType) => {
        switch (role) {
            case "SUPER_ADMIN": return { label: t("role_super_admin"), color: "text-[#eab308]", bg: "bg-[#eab308]/10" };
            case "CASHIER": return { label: t("role_cashier"), color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" };
            case "WAITER": return { label: t("role_waiter"), color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" };
            default: return { label: role, color: "text-[var(--muted)]", bg: "bg-[var(--muted)]/10" };
        }
    };

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getUsers(token!);
            if (res.success) setPeople(res.data);
        } catch (err) {
            console.error(err);
            setError(t("error_general", { defaultValue: "Personel listesi yüklenirken hata oluştu." }));
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEditPerson = async (e: React.FormEvent) => {
        e.preventDefault();

        const isWaiter = role === 'WAITER';
        const needsUsername = role && role !== 'WAITER';

        if (!name.trim() || !role || (needsUsername && !username.trim())) {
            setError(t("error_fill_all_fields"));
            return;
        }

        if (isWaiter && !pin.trim()) {
            setError(t("error_waiter_pin_required"));
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const userData = {
                name_surname: name.trim(),
                name: name.trim(),
                username: isWaiter ? null : username.trim(),
                role: role as RoleType,
                pin_code: isWaiter ? pin.trim() : null,
                ...(isWaiter ? {} : (password ? { password } : (editingUserId ? {} : { password: "123456" })))
            };

            if (editingUserId) {
                const res = await userService.updateUser(editingUserId, userData, token!);
                if (res.success) {
                    handleCancelEdit();
                    fetchUsers();
                }
            } else {
                const res = await userService.addUser(userData, token!);
                if (res.success) {
                    handleCancelEdit();
                    fetchUsers();
                }
            }
        } catch (err: any) {
            setError(err.message || t("error_general", { defaultValue: "İşlem başarısız" }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (person: UserType) => {
        setEditingUserId(person.id);
        setName(person.name_surname || "");
        setUsername(person.role === 'WAITER' ? "" : (person.username || ""));
        setRole(person.role);
        setPin(person.pin_code || "");
        setPassword("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setName("");
        setUsername("");
        setPassword("");
        setRole("");
        setPin("");
        setError("");
    };

    const handleRoleChange = (newRole: RoleType | "") => {
        setRole(newRole);
        if (newRole === 'WAITER') {
            setUsername("");
        }
    };

    // Clear username when switching to WAITER
    useEffect(() => {
        if (role === 'WAITER') {
            setUsername("");
        }
    }, [role]);

    const handleDelete = async (id: string) => {
        const personToDelete = people.find(p => p.id === id);

        if (personToDelete?.role === "SUPER_ADMIN") {
            const superAdminCount = people.filter(p => p.role === "SUPER_ADMIN").length;
            if (superAdminCount <= 1) {
                setError(t("error_min_super_admin"));
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        if (await showConfirm(t("personnel_delete_confirm"), t("personnel_delete_title"))) {
            try {
                const res = await userService.deleteUser(id, token!);
                if (res.success) fetchUsers();
            } catch (err: any) {
                await showAlert(err.message || t("error_general", { defaultValue: "Silme işlemi başarısız" }), "error");
            }
        }
    };

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-[var(--foreground)] tracking-widest uppercase mb-1 drop-shadow-md italic">
                    {t("personnel_management")}
                </h1>
                <p className="text-[var(--muted)] text-[15px] font-medium tracking-wide">
                    {t("personnel_subtitle")}
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sol: Yeni Personel Formu */}
                <div className="w-full lg:w-[420px] flex-shrink-0 bg-[var(--card)] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308]/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none transition-all duration-500 group-hover:bg-[#eab308]/10" />

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[20px] text-xs font-black flex items-start gap-3 mb-6 relative z-20 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {editingUserId ? (
                                    <Edit2 size={24} className="text-[#eab308]" />
                                ) : (
                                    <UserPlus size={24} className="text-[#eab308]" />
                                )}
                                <h2 className="text-xl font-black text-[var(--foreground)] tracking-wide uppercase italic">
                                    {editingUserId ? t("edit_personnel") : t("add_new_personnel")}
                                </h2>
                            </div>
                            {editingUserId && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-2 text-[var(--muted)] hover:text-[#ef4444] transition-colors rounded-full hover:bg-[#3f1515]/50 flex items-center justify-center"
                                    title="Düzenlemeyi İptal Et"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleAddOrEditPerson} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em]">
                                    {t("name_surname")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("name_placeholder")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold border border-transparent hover:border-[var(--border)]"
                                />
                            </div>

                            {role !== 'WAITER' && role !== "" && (
                                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-2">
                                    <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em]">
                                        {t("username_label")}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)] font-black">@</span>
                                        <input
                                            type="text"
                                            required
                                            placeholder={t("username_placeholder")}
                                            value={username || ""}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] pl-10 pr-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold border border-transparent hover:border-[var(--border)]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em]">
                                        {t("role_label")}
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={role}
                                            onChange={(e) => handleRoleChange(e.target.value as RoleType)}
                                            className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] px-4 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold appearance-none border border-transparent hover:border-[var(--border)]"
                                        >
                                            <option value="" disabled className="text-[var(--muted)]">{t("select_option")}</option>
                                            <option value="SUPER_ADMIN">{t("role_super_admin")}</option>
                                            <option value="CASHIER">{t("role_cashier")}</option>
                                            <option value="WAITER">{t("role_waiter")}</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[var(--muted)]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em] leading-tight truncate">
                                        {role === 'WAITER' ? t("pin_code_label") : t("new_password_label")}
                                    </label>
                                    <input
                                        type={role === 'WAITER' ? "text" : "password"}
                                        placeholder={role === 'WAITER' ? t("pin_placeholder") : (editingUserId ? "****" : t("password_placeholder"))}
                                        value={role === 'WAITER' ? (pin || "") : (password || "")}
                                        onChange={(e) => role === 'WAITER' ? setPin(e.target.value) : setPassword(e.target.value)}
                                        className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] px-4 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-black border border-transparent hover:border-[var(--border)]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#facc15] to-[#eab308] text-[var(--background)] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all duration-300 mt-2 tracking-wide disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin inline mr-2" /> : (
                                    <>
                                        {editingUserId ? <Save size={20} /> : <UserPlus size={20} />}
                                        {editingUserId ? t("update_personnel") : t("save_personnel")}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sağ: Personel Listesi */}
                <div className="flex-1 w-full flex flex-col gap-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-[#eab308]" size={40} />
                        </div>
                    ) : (
                        <>
                            {people.map((person) => {
                                const style = getRoleDisplay(person.role as RoleType);
                                return (
                                    <div
                                        key={person.id}
                                        className={`bg-[var(--card)] border rounded-[32px] p-6 flex items-center justify-between transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${editingUserId === person.id ? 'border-[#eab308]/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-transparent hover:border-[#eab308]/10'}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-[72px] h-[72px] bg-[var(--background)] rounded-[24px] flex items-center justify-center relative flex-shrink-0 border border-[var(--border)]">
                                                <User size={32} className="text-[var(--muted)]" />
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--card)] rounded-lg flex items-center justify-center border border-[var(--border)]">
                                                    <Settings size={14} className="text-[#eab308]" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xl font-black text-[var(--foreground)] uppercase italic tracking-tighter leading-none">{person.name_surname}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[10px] border ${style.color} ${style.bg} border-current opacity-80 shadow-sm`}>
                                                        {style.label}
                                                    </span>
                                                    {person.role !== 'WAITER' && (
                                                        <>
                                                            <span className="text-[var(--muted)] opacity-60 italic text-[13px] font-bold">@{person.username}</span>
                                                            <span className="text-[var(--border-alt)]">•</span>
                                                        </>
                                                    )}
                                                    <div className="flex items-center gap-1.5 bg-[var(--background)] px-2 py-1 rounded-lg border border-[var(--border)]">
                                                        <Lock size={12} className="text-[var(--muted)]" />
                                                        <span className="text-[11px] font-black tracking-widest">{person.pin_code ? `PIN: ${person.pin_code}` : "AUTH"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleEditClick(person)}
                                                className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all ${editingUserId === person.id
                                                    ? "bg-[#eab308] text-[var(--background)] shadow-[0_5px_15px_rgba(234,179,8,0.3)] scale-105"
                                                    : "bg-[var(--border)] text-[var(--muted)] hover:bg-[#eab308] hover:text-[var(--background)] hover:scale-105"
                                                    }`}
                                                title="Düzenle"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(person.id)}
                                                className="w-12 h-12 rounded-[16px] bg-[#3f1515] flex items-center justify-center text-[#ef4444] hover:bg-[#ef4444] hover:text-[var(--foreground)] hover:scale-105 transition-all shadow-sm"
                                                title="Sil"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {people.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--border)] rounded-[32px]">
                                    <UserPlus size={48} className="text-[var(--border)] mb-4" />
                                    <h3 className="text-xl font-black text-[var(--foreground)] mb-2 uppercase italic">{t("no_personnel_found")}</h3>
                                    <p className="text-[var(--muted)] font-bold">{t("no_personnel_desc")}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

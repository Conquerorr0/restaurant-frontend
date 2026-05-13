"use client";

import React, { useState, useEffect } from "react";
import {
    Wallet, Plus, Trash2, X, Check,
    Loader2, AlertCircle, Calendar, CreditCard, Pencil, PieChart
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { expenseService, Expense } from "@/services/expenseService";
import { useTranslations } from "next-intl";

const CATEGORY_COLORS: Record<string, string> = {
    GENERAL: "#6366f1",
    RENT:    "#f59e0b",
    UTILITY: "#3b82f6",
    SALARY:  "#22c55e",
    SUPPLY:  "#ef4444",
};

const emptyForm = {
    title: "",
    amount: 0,
    category: "GENERAL",
    description: "",
    date: new Date().toISOString().split("T")[0],
};

function DonutChart({ expenses }: { expenses: Expense[] }) {
    const totals = expenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
    }, {});

    const total = Object.values(totals).reduce((s, v) => s + v, 0);
    if (total === 0) return null;

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const r = 70;
    const cx = 100;
    const cy = 100;
    const circumference = 2 * Math.PI * r;

    let cumulativeAngle = -90;
    const slices = entries.map(([cat, amount]) => {
        const fraction = amount / total;
        const angle = fraction * 360;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad   = ((startAngle + angle) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const largeArc = angle > 180 ? 1 : 0;
        return {
            cat,
            amount,
            fraction,
            path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
            color: CATEGORY_COLORS[cat] || "#94a3b8",
        };
    });

    return <svg viewBox="0 0 200 200" className="w-full h-full">{slices.map(s => <path key={s.cat} d={s.path} fill={s.color} opacity={0.85} />)}</svg>;
}

export default function ExpenseManagement() {
    const t = useTranslations("SuperAdmin");
    const { token } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ ...emptyForm });

    // Düzenleme state
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editFormData, setEditFormData] = useState({ ...emptyForm });
    const [editError, setEditError] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Tarih filtresi state
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    const fetchExpenses = async (from?: string, to?: string) => {
        setLoading(true);
        try {
            const res = await expenseService.getExpenses(token!, from || undefined, to || undefined);
            if (res.success) setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchExpenses();
    }, [token]);

    const handleFilter = () => fetchExpenses(filterFrom, filterTo);

    const handleClearFilter = () => {
        setFilterFrom("");
        setFilterTo("");
        fetchExpenses();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            const res = await expenseService.createExpense(formData, token!);
            if (res.success) {
                setShowModal(false);
                setFormData({ ...emptyForm });
                fetchExpenses(filterFrom, filterTo);
            }
        } catch (err: any) {
            setError(err.message || "Gider kaydedilemedi");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditOpen = (expense: Expense) => {
        setEditingExpense(expense);
        setEditFormData({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            description: expense.description || "",
            date: expense.date.split("T")[0],
        });
        setEditError("");
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExpense) return;
        setEditError("");
        setEditSubmitting(true);
        try {
            const res = await expenseService.updateExpense(editingExpense.id, editFormData, token!);
            if (res.success) {
                setEditingExpense(null);
                fetchExpenses(filterFrom, filterTo);
            }
        } catch (err: any) {
            setEditError(err.message || "Güncellenemedi");
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await showConfirm(t("expense_delete_confirm"), t("expense_delete_title")))) return;
        try {
            const res = await expenseService.deleteExpense(id, token!);
            if (res.success) fetchExpenses(filterFrom, filterTo);
        } catch (err: any) {
            await showAlert(err.message || "Silme başarısız", "error");
        }
    };

    const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
    }, {});
    const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    const inputClass = "w-full bg-[var(--background)] border border-[var(--border)] rounded-[16px] py-3 px-4 font-bold focus:border-red-500 outline-none";

    const ExpenseForm = ({
        data, onChange, onSubmit, submitLabel, isSubmitting, err
    }: {
        data: typeof emptyForm;
        onChange: (d: typeof emptyForm) => void;
        onSubmit: (e: React.FormEvent) => void;
        submitLabel: string;
        isSubmitting: boolean;
        err: string;
    }) => (
        <form onSubmit={onSubmit} className="p-8 pt-4 flex flex-col gap-5">
            {err && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-sm font-bold flex items-center gap-3">
                    <AlertCircle size={18} /> {err}
                </div>
            )}
            <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("title_label")}</label>
                <input required type="text" className={inputClass} placeholder={t("expense_title_placeholder")}
                    value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("amount")}</label>
                    <input required type="number" className={inputClass} placeholder="0.00"
                        value={data.amount} onChange={(e) => onChange({ ...data, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("date")}</label>
                    <input required type="date" className={`${inputClass} text-sm`}
                        value={data.date} onChange={(e) => onChange({ ...data, date: e.target.value })} />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("category")}</label>
                <select className={`${inputClass} appearance-none`} value={data.category}
                    onChange={(e) => onChange({ ...data, category: e.target.value })}>
                    <option value="GENERAL">{t("category_general")}</option>
                    <option value="RENT">{t("category_rent")}</option>
                    <option value="UTILITY">{t("category_utility")}</option>
                    <option value="SALARY">{t("category_salary")}</option>
                    <option value="SUPPLY">{t("category_supply")}</option>
                </select>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("description")}</label>
                <textarea className={`${inputClass} h-24 resize-none`} placeholder={t("expense_desc_placeholder")}
                    value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} />
            </div>
            <button type="submit" disabled={isSubmitting}
                className="w-full bg-[#ef4444] py-4 rounded-[18px] text-[var(--foreground)] font-black text-lg mt-4 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-red-500/20">
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> {submitLabel}</>}
            </button>
        </form>
    );

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[var(--foreground)] tracking-wide mb-1 uppercase italic">{t("expense_management")}</h1>
                    <p className="text-[var(--muted)] text-[15px] font-bold">{t("expense_subtitle")}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#ef4444] text-[var(--foreground)] px-6 py-3 rounded-[16px] font-black flex items-center gap-2 hover:scale-[1.05] transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                >
                    <Plus size={20} /> {t("add_expense")}
                </button>
            </div>

            {/* Toplam + Kategori Dağılımı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--card)] border border-red-500/20 rounded-[24px] p-6 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[20px] bg-red-500/10 flex items-center justify-center text-red-500">
                        <CreditCard size={32} />
                    </div>
                    <div>
                        <p className="text-[var(--muted)] text-xs font-black tracking-widest leading-none mb-2">{t("total_expense")}</p>
                        <p className="text-4xl font-black text-[var(--foreground)] italic">₺{totalAmount.toLocaleString("tr-TR")}</p>
                    </div>
                </div>

                {/* Kategori Pasta */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-[24px] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart size={16} className="text-[var(--muted)]" />
                        <p className="text-[10px] font-black text-[var(--muted)] tracking-widest uppercase">{t("expense_by_category")}</p>
                    </div>
                    {categoryEntries.length === 0 ? (
                        <p className="text-[var(--muted)] text-sm font-bold text-center py-4">{t("no_expense_data")}</p>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 flex-shrink-0">
                                <DonutChart expenses={expenses} />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1">
                                {categoryEntries.map(([cat, amt]) => {
                                    const pct = totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0;
                                    const color = CATEGORY_COLORS[cat] || "#94a3b8";
                                    return (
                                        <div key={cat} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                                <span className="text-[10px] font-black text-[var(--muted)] uppercase">{t(`category_${cat.toLowerCase()}`, { defaultValue: cat })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black" style={{ color }}>%{pct}</span>
                                                <span className="text-[11px] font-black text-[var(--foreground)]">₺{amt.toLocaleString("tr-TR")}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tarih Filtresi */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[20px] p-4 flex flex-wrap items-center gap-3">
                <Calendar size={16} className="text-[var(--muted)]" />
                <span className="text-[10px] font-black text-[var(--muted)] tracking-widest uppercase">{t("filter_from")}:</span>
                <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-[12px] py-2 px-3 text-sm font-bold focus:border-[#eab308] outline-none" />
                <span className="text-[10px] font-black text-[var(--muted)] tracking-widest uppercase">{t("filter_to")}:</span>
                <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-[12px] py-2 px-3 text-sm font-bold focus:border-[#eab308] outline-none" />
                <button onClick={handleFilter}
                    className="bg-[#eab308] text-black px-4 py-2 rounded-[12px] text-[10px] font-black tracking-widest hover:opacity-90 transition-all">
                    {t("apply_filter")}
                </button>
                {(filterFrom || filterTo) && (
                    <button onClick={handleClearFilter}
                        className="text-[var(--muted)] text-[10px] font-black tracking-widest hover:text-[var(--foreground)] transition-colors underline">
                        {t("clear_filter")}
                    </button>
                )}
            </div>

            {/* Gider Tablosu */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--card-alt)]">
                            <th className="px-6 py-5 text-[10px] font-black text-[var(--muted)] tracking-widest uppercase">{t("date")}</th>
                            <th className="px-6 py-5 text-[10px] font-black text-[var(--muted)] tracking-widest uppercase">{t("title_label")}</th>
                            <th className="px-6 py-5 text-[10px] font-black text-[var(--muted)] tracking-widest uppercase">{t("category")}</th>
                            <th className="px-6 py-5 text-[10px] font-black text-[var(--muted)] tracking-widest uppercase">{t("amount")}</th>
                            <th className="px-6 py-5 text-[10px] font-black text-[var(--muted)] tracking-widest uppercase">{t("action")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <Loader2 className="animate-spin text-[#eab308] mx-auto" size={40} />
                                </td>
                            </tr>
                        ) : expenses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-[var(--muted)] font-bold">
                                    {t("no_expenses")}
                                </td>
                            </tr>
                        ) : expenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-[var(--card-alt)] transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-[var(--foreground)] font-bold text-sm">
                                        <Calendar size={14} className="text-[var(--muted)]" />
                                        {new Date(expense.date).toLocaleDateString("tr-TR")}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-[var(--foreground)] font-black uppercase text-sm">{expense.title}</p>
                                    <p className="text-[var(--muted)] text-xs font-medium">{expense.description || "-"}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="px-3 py-1 rounded-full bg-[var(--border)] text-[var(--muted)] text-[10px] font-black">
                                        {t(`category_${expense.category.toLowerCase()}`, { defaultValue: expense.category })}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-red-500 font-black text-lg italic">₺{Number(expense.amount).toLocaleString("tr-TR")}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditOpen(expense)}
                                            className="p-2 bg-[#eab308]/10 hover:bg-[#eab308]/20 text-[#eab308] rounded-xl transition-all">
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(expense.id)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Yeni Gider Modalı */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--background)]/80 backdrop-blur-sm">
                    <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300 text-[var(--foreground)]">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black italic uppercase">{t("new_expense_title")}</h2>
                            <button onClick={() => { setShowModal(false); setError(""); }} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <ExpenseForm data={formData} onChange={setFormData} onSubmit={handleSubmit}
                            submitLabel={t("save_expense")} isSubmitting={submitting} err={error} />
                    </div>
                </div>
            )}

            {/* Düzenleme Modalı */}
            {editingExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--background)]/80 backdrop-blur-sm">
                    <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300 text-[var(--foreground)]">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black italic uppercase">{t("edit_expense_title")}</h2>
                            <button onClick={() => setEditingExpense(null)} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <ExpenseForm data={editFormData} onChange={setEditFormData} onSubmit={handleEditSubmit}
                            submitLabel={t("update_expense")} isSubmitting={editSubmitting} err={editError} />
                    </div>
                </div>
            )}
        </div>
    );
}

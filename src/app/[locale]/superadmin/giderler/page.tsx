"use client";

import React, { useState, useEffect } from "react";
import {
    Wallet, Plus, Trash2, Search, X, Check,
    Loader2, AlertCircle, Calendar, Tag, CreditCard
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { expenseService, Expense } from "@/services/expenseService";
import { useTranslations, useLocale } from "next-intl";

export default function ExpenseManagement() {
    const t = useTranslations("SuperAdmin");
    const locale = useLocale();
    const { token } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        amount: 0,
        category: "GENERAL",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (token) fetchExpenses();
    }, [token]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await expenseService.getExpenses(token!);
            if (res.success) setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            const res = await expenseService.createExpense(formData, token!);
            if (res.success) {
                setShowModal(false);
                fetchExpenses();
                setFormData({
                    title: "",
                    amount: 0,
                    category: "GENERAL",
                    description: "",
                    date: new Date().toISOString().split('T')[0]
                });
            }
        } catch (err: any) {
            setError(err.message || t("error_general", { defaultValue: "Gider kaydedilemedi" }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await showConfirm(t("expense_delete_confirm"), t("expense_delete_title")))) return;
        try {
            const res = await expenseService.deleteExpense(id, token!);
            if (res.success) fetchExpenses();
        } catch (err: any) {
            await showAlert(err.message || t("error_general", { defaultValue: "Silme işlemi başarısız" }), "error");
        }
    };

    const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

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

            {/* Total Card */}
            <div className="bg-[var(--card)] border border-red-500/20 rounded-[24px] p-6 flex items-center gap-6">
                <div className="w-16 h-16 rounded-[20px] bg-red-500/10 flex items-center justify-center text-red-500">
                    <CreditCard size={32} />
                </div>
                <div>
                    <p className="text-[var(--muted)] text-xs font-black tracking-widest leading-none mb-2">{t("total_expense")}</p>
                    <p className="text-4xl font-black text-[var(--foreground)] italic">₺{totalAmount.toLocaleString('tr-TR')}</p>
                </div>
            </div>

            {/* Expense Table */}
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
                                        {new Date(expense.date).toLocaleDateString('tr-TR')}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-[var(--foreground)] font-black uppercase text-sm">{expense.title}</p>
                                    <p className="text-[var(--muted)] text-xs font-medium">{expense.description || '-'}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="px-3 py-1 rounded-full bg-[var(--border)] text-[var(--muted)] text-[10px] font-black">
                                        {t(`category_${expense.category.toLowerCase()}`, { defaultValue: expense.category })}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-red-500 font-black text-lg italic">₺{expense.amount.toLocaleString('tr-TR')}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--background)]/80 backdrop-blur-sm">
                    <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300 text-[var(--foreground)]">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black italic uppercase">{t("new_expense_title")}</h2>
                            <button onClick={() => setShowModal(false)} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
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
                                <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("title_label")}</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[16px] py-3 px-4 font-bold focus:border-red-500 outline-none"
                                    placeholder={t("expense_title_placeholder")}
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("amount")}</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[16px] py-3 px-4 font-bold focus:border-red-500 outline-none"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("date")}</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[16px] py-3 px-4 font-bold focus:border-red-500 outline-none text-sm"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("category")}</label>
                                <select
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[16px] py-3 px-4 font-bold focus:border-red-500 outline-none appearance-none"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="GENERAL">{t("category_general")}</option>
                                    <option value="RENT">{t("category_rent")}</option>
                                    <option value="UTILITY">{t("category_utility")}</option>
                                    <option value="SALARY">{t("category_salary")}</option>
                                    <option value="SUPPLY">{t("category_supply")}</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[var(--muted)] tracking-widest uppercase">{t("description")}</label>
                                <textarea
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[16px] py-3 px-4 font-bold focus:border-red-500 outline-none h-24 resize-none"
                                    placeholder={t("expense_desc_placeholder")}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#ef4444] py-4 rounded-[18px] text-[var(--foreground)] font-black text-lg mt-4 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-red-500/20"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> {t("save_expense")}</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

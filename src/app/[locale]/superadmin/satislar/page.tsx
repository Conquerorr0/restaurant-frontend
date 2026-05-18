"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    TrendingUp, Loader2, Calendar, Banknote, CreditCard, UtensilsCrossed,
    XCircle, Gift, AlertCircle, Trash2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { reportService, PaymentsList, PaymentTransaction } from "@/services/reportService";
import { paymentService } from "@/services/paymentService";
import { useTranslations } from "next-intl";

const METHOD_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    CASH:        { label: "method_cash",   color: "#22c55e", bg: "bg-green-500/10 text-green-400",   icon: <Banknote size={12} /> },
    CREDIT_CARD: { label: "method_card",   color: "#3b82f6", bg: "bg-blue-500/10 text-blue-400",     icon: <CreditCard size={12} /> },
    MEAL_CARD:   { label: "method_meal",   color: "#a855f7", bg: "bg-purple-500/10 text-purple-400", icon: <UtensilsCrossed size={12} /> },
    CANCEL:      { label: "method_cancel", color: "#ef4444", bg: "bg-red-500/10 text-red-400",        icon: <XCircle size={12} /> },
    TREAT:       { label: "method_treat",  color: "#f97316", bg: "bg-orange-500/10 text-orange-400", icon: <Gift size={12} /> },
};

function DonutChart({ byMethod, t }: { byMethod: PaymentsList["summary"]["by_method"]; t: (k: string) => string }) {
    const entries: [string, number][] = [
        ["CASH",        byMethod.CASH],
        ["CREDIT_CARD", byMethod.CREDIT_CARD],
        ["MEAL_CARD",   byMethod.MEAL_CARD],
    ].filter(([, v]) => (v as number) > 0) as [string, number][];

    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (total === 0) return (
        <div className="flex items-center justify-center h-full text-[var(--muted)] text-xs">{t("no_transactions")}</div>
    );

    const r = 70, cx = 100, cy = 100;
    let cumulativeAngle = -90;
    const slices = entries.map(([method, amount]) => {
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
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return { method, amount, fraction, path, color: METHOD_CONFIG[method]?.color ?? "#888" };
    });

    const fmt = (n: number) =>
        n >= 1000 ? `₺${(n / 1000).toFixed(1)}k` : `₺${n.toFixed(0)}`;

    return (
        <div className="flex flex-col items-center gap-4 h-full justify-center">
            <svg viewBox="0 0 200 200" className="w-36 h-36">
                {slices.map(s => (
                    <path key={s.method} d={s.path} fill={s.color} stroke="var(--card)" strokeWidth={3} />
                ))}
                <circle cx={cx} cy={cy} r={42} fill="var(--card)" />
                <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--foreground)" fontSize={11} fontWeight="800">{fmt(total)}</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--muted)" fontSize={8}>TOPLAM</text>
            </svg>
            <div className="flex flex-col gap-1.5 w-full">
                {slices.map(s => (
                    <div key={s.method} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-[var(--muted)] font-semibold">{t(METHOD_CONFIG[s.method]?.label ?? s.method)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                            <span className="font-bold text-[var(--foreground)]">{fmt(s.amount)}</span>
                            <span className="text-[var(--muted)] w-10 text-right">%{(s.fraction * 100).toFixed(0)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const today = () => new Date().toISOString().split("T")[0];

export default function SatislarPage() {
    const t = useTranslations("SuperAdmin");
    const { token } = useAuth();
    const { showConfirm } = useModal();

    const [filterFrom, setFilterFrom] = useState(today);
    const [filterTo, setFilterTo] = useState(today);
    const [appliedFrom, setAppliedFrom] = useState(today);
    const [appliedTo, setAppliedTo] = useState(today);
    const [data, setData] = useState<PaymentsList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchData = useCallback(async (from: string, to: string) => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const res = await reportService.getPaymentsList(token, from, to);
            if (res.success) setData(res.data);
        } catch {
            setError("Veriler yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData(appliedFrom, appliedTo);
    }, [fetchData, appliedFrom, appliedTo]);

    const handleFilter = () => {
        setAppliedFrom(filterFrom);
        setAppliedTo(filterTo);
    };

    const handleClear = () => {
        const t0 = today();
        setFilterFrom(t0);
        setFilterTo(t0);
        setAppliedFrom(t0);
        setAppliedTo(t0);
    };

    const handleDelete = async (row: PaymentTransaction) => {
        const confirmed = await showConfirm(t("payment_delete_confirm"), t("payment_delete_title"));
        if (!confirmed || !token) return;
        setDeletingId(row.id);
        try {
            await paymentService.deletePayment(row.id, token);
            await fetchData(appliedFrom, appliedTo);
        } catch {
            setError("Silme işlemi başarısız oldu.");
        } finally {
            setDeletingId(null);
        }
    };

    const fmt = (n: number) => `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const summary = data?.summary;

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight">{t("sales_management")}</h1>
                <p className="text-[var(--muted)] text-sm mt-1">{t("sales_subtitle")}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Metrics */}
                <div className="bg-[var(--card)] rounded-[20px] p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-[12px] bg-[#eab308]/10 flex items-center justify-center">
                            <TrendingUp size={18} className="text-[#eab308]" />
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-[var(--muted)]">{t("today_revenue")}</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-2 text-[var(--muted)]"><Loader2 size={16} className="animate-spin" /><span className="text-sm">{t("loading")}</span></div>
                    ) : (
                        <>
                            <div>
                                <p className="text-4xl font-black text-[#eab308]">{fmt(summary?.total_revenue ?? 0)}</p>
                                <p className="text-[var(--muted)] text-xs mt-1 font-semibold">{t("total_revenue")}</p>
                            </div>
                            <div className="border-t border-[var(--border)] pt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-black">{summary?.transaction_count ?? 0}</p>
                                    <p className="text-[var(--muted)] text-xs mt-0.5 font-semibold">{t("transaction_count")}</p>
                                </div>
                                <div className="flex flex-col gap-1.5 items-end">
                                    {(summary?.cancel_total ?? 0) > 0 && (
                                        <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                            <XCircle size={11} /> {t("method_cancel")} {fmt(summary!.cancel_total)}
                                        </span>
                                    )}
                                    {(summary?.treat_total ?? 0) > 0 && (
                                        <span className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                            <Gift size={11} /> {t("method_treat")} {fmt(summary!.treat_total)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Donut Chart */}
                <div className="bg-[var(--card)] rounded-[20px] p-6 flex flex-col">
                    <span className="text-[11px] font-black tracking-widest text-[var(--muted)] mb-4">{t("payment_method_dist")}</span>
                    {loading ? (
                        <div className="flex items-center justify-center flex-1 text-[var(--muted)]"><Loader2 size={20} className="animate-spin" /></div>
                    ) : (
                        <div className="flex-1">
                            <DonutChart byMethod={summary?.by_method ?? { CASH: 0, CREDIT_CARD: 0, MEAL_CARD: 0 }} t={t} />
                        </div>
                    )}
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-[var(--card)] rounded-[20px] px-6 py-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-[var(--muted)]">
                    <Calendar size={16} className="text-[#eab308]" />
                    <span className="text-[11px] font-black tracking-widest">{t("filter_from")}</span>
                </div>
                <input
                    type="date"
                    value={filterFrom}
                    onChange={e => setFilterFrom(e.target.value)}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-semibold text-[var(--foreground)] focus:outline-none focus:border-[#eab308]"
                />
                <span className="text-[var(--muted)] text-xs font-black">{t("filter_to")}</span>
                <input
                    type="date"
                    value={filterTo}
                    onChange={e => setFilterTo(e.target.value)}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-semibold text-[var(--foreground)] focus:outline-none focus:border-[#eab308]"
                />
                <button
                    onClick={handleFilter}
                    className="bg-[#eab308] text-[var(--background)] text-[11px] font-black tracking-wider px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors"
                >
                    {t("apply_filter")}
                </button>
                <button
                    onClick={handleClear}
                    className="text-[var(--muted)] text-[11px] font-semibold hover:text-[var(--foreground)] transition-colors"
                >
                    {t("clear_filter")}
                </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-[var(--card)] rounded-[20px] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-[13px] font-black tracking-widest text-[var(--muted)]">
                        {t("sales_management")} — {data?.rows.length ?? 0} KAYIT
                    </h2>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 p-6 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm font-semibold">{t("loading")}</span>
                    </div>
                ) : !data || data.rows.length === 0 ? (
                    <div className="text-center py-16 text-[var(--muted)] text-sm font-semibold">
                        {t("no_transactions")}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]">
                                    {[t("time"), t("date"), t("table_col"), t("waiter"), t("payment_method"), t("amount")].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-[10px] font-black tracking-widest text-[var(--muted)]">{h}</th>
                                    ))}
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row: PaymentTransaction) => {
                                    const mc = METHOD_CONFIG[row.payment_method];
                                    const isRevenue = ["CASH", "CREDIT_CARD", "MEAL_CARD"].includes(row.payment_method);
                                    return (
                                        <tr
                                            key={row.id}
                                            className="border-b border-[var(--border)]/50 hover:bg-[var(--border)]/20 transition-colors"
                                        >
                                            <td className="px-6 py-3.5 text-sm font-bold">{row.time_label}</td>
                                            <td className="px-6 py-3.5 text-sm text-[var(--muted)]">{row.date_label}</td>
                                            <td className="px-6 py-3.5 text-sm font-semibold">{row.table_name}</td>
                                            <td className="px-6 py-3.5 text-sm text-[var(--muted)]">{row.waiter_name}</td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg ${mc?.bg ?? ""}`}>
                                                    {mc?.icon}
                                                    {t(mc?.label ?? row.payment_method)}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-3.5 text-sm font-black ${isRevenue ? "text-[#eab308]" : "text-[var(--muted)]"}`}>
                                                {isRevenue ? "+" : "-"}{fmt(row.amount)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <button
                                                    onClick={() => handleDelete(row)}
                                                    disabled={deletingId === row.id}
                                                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                                                    title={t("delete")}
                                                >
                                                    {deletingId === row.id
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <Trash2 size={14} />
                                                    }
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

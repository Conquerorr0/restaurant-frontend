"use client";

import React, { useState, useEffect } from "react";
import {
    TrendingUp, Users, ShoppingBag, Home,
    Loader2, ArrowUpRight, ArrowDownRight,
    Wallet, Receipt, Calculator, TrendingDown,
    ChevronDown, ChevronUp, CreditCard, Banknote, UtensilsCrossed
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    reportService, DashboardStats, ChartDataPoint, DailySummary,
    DailyBreakdown, DailyBreakdownRow
} from "@/services/reportService";
import { useTranslations } from "next-intl";

export default function SuperAdminDashboard() {
    const t = useTranslations("SuperAdmin");
    const { token } = useAuth();

    const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
    const [breakdownPeriod, setBreakdownPeriod] = useState<"week" | "month">("week");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [summary, setSummary] = useState<DailySummary | null>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [staffStats, setStaffStats] = useState<any[]>([]);
    const [breakdown, setBreakdown] = useState<DailyBreakdown | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [activeChart, setActiveChart] = useState<"revenue" | "net">("revenue");

    useEffect(() => {
        if (!token) return;
        fetchOverview();
        fetchSummary();
        fetchTopProducts();
        fetchStaffPerformance();
    }, [token]);

    useEffect(() => {
        if (token) fetchChartData();
    }, [token, chartPeriod]);

    useEffect(() => {
        if (token) fetchBreakdown();
    }, [token, breakdownPeriod]);

    const fetchOverview = async () => {
        try {
            const res = await reportService.getDashboardStats(token!);
            if (res.success) setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchChartData = async () => {
        try {
            const res = await reportService.getRevenueChartData(token!, chartPeriod);
            if (res.success) setChartData(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await reportService.getDailySummary(token!);
            if (res.success) setSummary(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchTopProducts = async () => {
        try {
            const res = await reportService.getTopProducts(token!);
            if (res.success) setTopProducts(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchStaffPerformance = async () => {
        try {
            const res = await reportService.getStaffPerformance(token!);
            if (res.success) setStaffStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchBreakdown = async () => {
        try {
            const res = await reportService.getDailyBreakdown(token!, breakdownPeriod);
            if (res.success) setBreakdown(res.data);
        } catch (err) { console.error(err); }
    };

    const toggleRow = (i: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const dashboardCards = [
        {
            title: t("today_revenue"),
            value: stats ? `₺${fmt(stats.today.revenue)}` : "₺0",
            icon: TrendingUp,
            badge: stats ? `${stats.today.revenue_change >= 0 ? '+' : ''}${stats.today.revenue_change}%` : "0%",
            badgeColor: stats && stats.today.revenue_change >= 0 ? "text-green-500" : "text-red-500",
            badgeBg: stats && stats.today.revenue_change >= 0 ? "bg-green-500/10" : "bg-red-500/10",
            trend: stats && stats.today.revenue_change >= 0 ? "up" : "down"
        },
        {
            title: t("active_personnel"),
            value: stats ? stats.personnel_count.toString() : "0",
            icon: Users,
            badge: t("stable"),
            badgeColor: "text-blue-500",
            badgeBg: "bg-blue-500/10",
            trend: "none"
        },
        {
            title: t("today_orders"),
            value: stats ? stats.today.order_count.toString() : "0",
            icon: ShoppingBag,
            badge: stats ? `${stats.today.count_change >= 0 ? '+' : ''}${stats.today.count_change}%` : "0%",
            badgeColor: stats && stats.today.count_change >= 0 ? "text-green-500" : "text-red-500",
            badgeBg: stats && stats.today.count_change >= 0 ? "bg-green-500/10" : "bg-red-500/10",
            trend: stats && stats.today.count_change >= 0 ? "up" : "down"
        },
        {
            title: t("occupancy_rate"),
            value: stats ? `%${stats.occupancy_rate}` : "%0",
            icon: Home,
            badge: stats && stats.occupancy_rate > 50 ? t("high") : t("normal"),
            badgeColor: stats && stats.occupancy_rate > 50 ? "text-orange-500" : "text-blue-500",
            badgeBg: stats && stats.occupancy_rate > 50 ? "bg-orange-500/10" : "bg-blue-500/10",
            trend: "none"
        },
    ];

    if (loading && !stats) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-[var(--muted)]">
                <Loader2 className="animate-spin" size={40} />
                <p className="font-bold">{t("loading")}</p>
            </div>
        );
    }

    // Chart helpers — dual dataset (revenue + expenses)
    const chartValues = chartData.map(d => activeChart === "revenue" ? d.value : (d.net ?? 0));
    const maxVal = chartValues.length > 0 ? Math.max(...chartValues, 100) : 100;
    const minVal = Math.min(...chartValues, 0);
    const range = maxVal - minVal || 1;

    const points = chartData.map((d, i) => {
        const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 780 + 10 : 400;
        const v = activeChart === "revenue" ? d.value : (d.net ?? 0);
        const y = 260 - ((v - minVal) / range) * 220 + 20;
        return `${x},${y}`;
    }).join(" ");

    const yLabels = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, Math.max(minVal, 0)];

    const netColor = (summary?.net_profit ?? 0) >= 0 ? "text-green-500" : "text-red-500";
    const netBg = (summary?.net_profit ?? 0) >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20";

    return (
        <div className="w-full flex flex-col gap-10 pb-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[var(--foreground)] tracking-wide mb-1 uppercase italic">
                        {t("dashboard_title")}
                    </h1>
                    <p className="text-[var(--muted)] text-[15px] font-medium font-bold">
                        {t("subtitle")}
                    </p>
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-full px-4 py-2 flex items-center gap-2 text-xs font-black text-[#eab308]">
                    <div className="w-2 h-2 rounded-full bg-[#eab308] animate-pulse"></div>
                    {t("live_data_badge")}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className="bg-[var(--card)] rounded-[24px] p-6 border border-[var(--border)]/50 flex flex-col gap-5 transition-transform hover:scale-[1.02] duration-300 shadow-lg relative overflow-hidden group"
                        >
                            <div className="flex items-start justify-between relative z-10">
                                <div className="w-12 h-12 rounded-[16px] bg-[#eab308]/10 flex items-center justify-center group-hover:bg-[#eab308]/20 transition-colors">
                                    <Icon size={22} className="text-[#eab308]" />
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${stat.badgeBg} ${stat.badgeColor}`}>
                                    {stat.trend === 'up' && <ArrowUpRight size={10} />}
                                    {stat.trend === 'down' && <ArrowDownRight size={10} />}
                                    {stat.badge}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 relative z-10">
                                <span className="text-[var(--muted)] text-[10px] font-black tracking-[0.2em] uppercase">
                                    {stat.title}
                                </span>
                                <span className="text-3xl font-black text-[var(--foreground)] italic">
                                    {stat.value}
                                </span>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                                <Icon size={120} className="text-[var(--foreground)]" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart + Profit/Loss Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area */}
                <div className="lg:col-span-2 bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6 relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10 flex-wrap gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-[var(--foreground)] tracking-wide mb-1 uppercase italic">
                                {t("revenue_flow")}
                            </h2>
                            <p className="text-[var(--muted)] text-sm font-bold">
                                {chartPeriod === 'week' ? t("last_7_days") : t("last_30_days")} {t("revenue_flow").toLowerCase()}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {/* Metric toggle */}
                            <div className="flex gap-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
                                <button onClick={() => setActiveChart("revenue")}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeChart === "revenue" ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                                    Gelir
                                </button>
                                <button onClick={() => setActiveChart("net")}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeChart === "net" ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                                    Net Kâr
                                </button>
                            </div>
                            {/* Period toggle */}
                            <div className="flex gap-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
                                <button onClick={() => setChartPeriod("week")}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${chartPeriod === "week" ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                                    {t("weekly_short")}
                                </button>
                                <button onClick={() => setChartPeriod("month")}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${chartPeriod === "month" ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                                    {t("monthly_short")}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full relative z-10">
                        <div className="flex gap-2">
                            {/* Y-axis labels */}
                            <div className="flex flex-col justify-between h-[280px] pr-2 shrink-0">
                                {yLabels.map((v, i) => (
                                    <span key={i} className="text-[9px] font-black text-[var(--muted)] text-right leading-none">
                                        ₺{v >= 1000 ? `${Math.round(v / 1000)}K` : Math.round(v)}
                                    </span>
                                ))}
                            </div>
                            {/* Chart */}
                            <div className="flex-1">
                                <svg viewBox="0 0 800 300" className="w-full h-[280px]" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />
                                            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid lines */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={i} x1="0" y1={20 + i * 55} x2="800" y2={20 + i * 55}
                                            stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                                    ))}
                                    {/* Zero line if net goes negative */}
                                    {minVal < 0 && (
                                        <line x1="0" y1={260 - ((0 - minVal) / range) * 220 + 20} x2="800"
                                            y2={260 - ((0 - minVal) / range) * 220 + 20}
                                            stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                                    )}
                                    {chartData.length > 1 && (
                                        <>
                                            <polyline
                                                fill="none"
                                                stroke="#eab308"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                points={points}
                                            />
                                            <path
                                                d={`M 10,280 L ${points} L 790,280 Z`}
                                                fill="url(#chartGlow)"
                                            />
                                            {/* Data point dots */}
                                            {chartData.map((d, i) => {
                                                const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 780 + 10 : 400;
                                                const v = activeChart === "revenue" ? d.value : (d.net ?? 0);
                                                const y = 260 - ((v - minVal) / range) * 220 + 20;
                                                return (
                                                    <circle key={i} cx={x} cy={y} r="4" fill="#eab308"
                                                        stroke="var(--card)" strokeWidth="2" />
                                                );
                                            })}
                                        </>
                                    )}
                                    {chartData.length === 0 && (
                                        <text x="400" y="150" textAnchor="middle"
                                            fill="var(--muted)" fontSize="14" fontWeight="bold">
                                            Veri yok
                                        </text>
                                    )}
                                </svg>
                                {/* X-Axis labels - show with chart data values */}
                                <div className="flex justify-between mt-2 px-1">
                                    {chartData
                                        .filter((_, i) => chartPeriod === 'week' || i % 5 === 0 || i === chartData.length - 1)
                                        .map((d, i) => (
                                            <div key={i} className="flex flex-col items-center gap-0.5">
                                                <span className="text-[9px] font-black text-[#eab308]">
                                                    {activeChart === "revenue"
                                                        ? (d.value > 0 ? `₺${d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : Math.round(d.value)}` : "-")
                                                        : ((d.net ?? 0) !== 0 ? `₺${Math.abs(d.net ?? 0) >= 1000 ? `${((d.net ?? 0) / 1000).toFixed(1)}K` : Math.round(d.net ?? 0)}` : "-")}
                                                </span>
                                                <span className="text-[9px] font-black text-[var(--muted)]">{d.label}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profit & Loss Summary */}
                <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-5">
                    <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">
                        {t("profit_loss_analysis")}
                    </h2>

                    {/* Today summary row */}
                    <div className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest -mb-2">Bugün</div>

                    <div className="flex flex-col gap-3">
                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Wallet size={18} />
                                </div>
                                <p className="text-[10px] font-black text-[var(--muted)] uppercase">{t("total_revenue")}</p>
                            </div>
                            <p className="text-base font-black text-[var(--foreground)]">
                                ₺{fmt(summary?.total_revenue ?? 0)}
                            </p>
                        </div>

                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Receipt size={18} />
                                </div>
                                <p className="text-[10px] font-black text-[var(--muted)] uppercase">{t("total_cogs")}</p>
                            </div>
                            <p className="text-base font-black text-orange-500">
                                -₺{fmt(summary?.total_cogs ?? 0)}
                            </p>
                        </div>

                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                    <Calculator size={18} />
                                </div>
                                <p className="text-[10px] font-black text-[var(--muted)] uppercase">{t("total_expenses")}</p>
                            </div>
                            <p className="text-base font-black text-red-500">
                                -₺{fmt(summary?.total_expenses ?? 0)}
                            </p>
                        </div>

                        {/* Gross profit mini row */}
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black text-[var(--muted)] uppercase">Brüt Kâr</span>
                            <span className={`text-sm font-black ${(summary?.gross_profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                ₺{fmt(summary?.gross_profit ?? 0)}
                            </span>
                        </div>

                        {/* Net profit big box */}
                        <div className={`p-5 rounded-[20px] border ${netBg} flex flex-col gap-1`}>
                            <div className="flex justify-between items-center">
                                <p className="text-[11px] font-black text-[var(--muted)] uppercase tracking-widest">{t("net_profit_loss")}</p>
                                <div className={`p-1.5 rounded-lg ${netColor}`}>
                                    {(summary?.net_profit ?? 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                </div>
                            </div>
                            <p className={`text-4xl font-black italic ${netColor}`}>
                                {(summary?.net_profit ?? 0) < 0 ? "-" : ""}₺{fmt(Math.abs(summary?.net_profit ?? 0))}
                            </p>
                            {/* Payment breakdown mini pills */}
                            {summary && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {summary.payment_distribution.CASH > 0 && (
                                        <span className="bg-green-500/10 text-green-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Banknote size={9} /> Nakit ₺{fmt(summary.payment_distribution.CASH)}
                                        </span>
                                    )}
                                    {summary.payment_distribution.CREDIT_CARD > 0 && (
                                        <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CreditCard size={9} /> K.Kartı ₺{fmt(summary.payment_distribution.CREDIT_CARD)}
                                        </span>
                                    )}
                                    {summary.payment_distribution.MEAL_CARD > 0 && (
                                        <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <UtensilsCrossed size={9} /> Yemek ₺{fmt(summary.payment_distribution.MEAL_CARD)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">
                            Günlük Gelir & Gider Tablosu
                        </h2>
                        <p className="text-[var(--muted)] text-sm font-bold mt-0.5">
                            Tarih bazlı kazanç ve gider dökümü
                        </p>
                    </div>
                    <div className="flex gap-2 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
                        <button onClick={() => setBreakdownPeriod("week")}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${breakdownPeriod === "week" ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                            Son 7 Gün
                        </button>
                        <button onClick={() => setBreakdownPeriod("month")}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${breakdownPeriod === "month" ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                            Son 30 Gün
                        </button>
                    </div>
                </div>

                {/* Totals summary bar */}
                {breakdown && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[var(--background)] rounded-2xl p-4 border border-[var(--border)] text-center">
                            <p className="text-[10px] font-black text-[var(--muted)] uppercase mb-1">Toplam Gelir</p>
                            <p className="text-xl font-black text-blue-400">₺{fmt(breakdown.totals.revenue)}</p>
                        </div>
                        <div className="bg-[var(--background)] rounded-2xl p-4 border border-[var(--border)] text-center">
                            <p className="text-[10px] font-black text-[var(--muted)] uppercase mb-1">Toplam Gider</p>
                            <p className="text-xl font-black text-red-400">₺{fmt(breakdown.totals.expenses)}</p>
                        </div>
                        <div className={`rounded-2xl p-4 border text-center ${breakdown.totals.net >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                            <p className="text-[10px] font-black text-[var(--muted)] uppercase mb-1">Net Kâr/Zarar</p>
                            <p className={`text-xl font-black ${breakdown.totals.net >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {breakdown.totals.net < 0 ? "-" : ""}₺{fmt(Math.abs(breakdown.totals.net))}
                            </p>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--background)] border-b border-[var(--border)]">
                                <th className="text-left px-4 py-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Tarih</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Gelir</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest hidden md:table-cell">Nakit</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest hidden md:table-cell">K.Kartı</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest hidden md:table-cell">Yemek K.</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Gider</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Net</th>
                                <th className="px-4 py-3 w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {breakdown?.rows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-[var(--muted)] font-bold">
                                        Veri bulunamadı
                                    </td>
                                </tr>
                            )}
                            {breakdown?.rows.map((row, i) => (
                                <React.Fragment key={i}>
                                    <tr
                                        className={`border-b border-[var(--border)] transition-colors ${row.expense_details.length > 0 ? "cursor-pointer hover:bg-[var(--background)]" : ""} ${expandedRows.has(i) ? "bg-[var(--background)]" : ""}`}
                                        onClick={() => row.expense_details.length > 0 && toggleRow(i)}
                                    >
                                        <td className="px-4 py-3 font-black text-[var(--foreground)] text-sm">{row.date}</td>
                                        <td className="px-4 py-3 text-right font-black text-blue-400">
                                            {row.revenue > 0 ? `₺${fmt(row.revenue)}` : <span className="text-[var(--muted)]">-</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-[var(--muted)] text-xs hidden md:table-cell">
                                            {row.cash > 0 ? `₺${fmt(row.cash)}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-[var(--muted)] text-xs hidden md:table-cell">
                                            {row.card > 0 ? `₺${fmt(row.card)}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-[var(--muted)] text-xs hidden md:table-cell">
                                            {row.meal > 0 ? `₺${fmt(row.meal)}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-red-400">
                                            {row.expenses > 0
                                                ? <span className="flex items-center justify-end gap-1">
                                                    ₺{fmt(row.expenses)}
                                                    {row.expense_details.length > 0 && (
                                                        <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 text-[8px] flex items-center justify-center font-black">
                                                            {row.expense_details.length}
                                                        </span>
                                                    )}
                                                </span>
                                                : <span className="text-[var(--muted)]">-</span>}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-black text-sm ${row.net >= 0 ? "text-green-400" : "text-red-400"}`}>
                                            {row.net !== 0
                                                ? `${row.net < 0 ? "-" : ""}₺${fmt(Math.abs(row.net))}`
                                                : <span className="text-[var(--muted)]">-</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.expense_details.length > 0 && (
                                                expandedRows.has(i)
                                                    ? <ChevronUp size={14} className="text-[var(--muted)]" />
                                                    : <ChevronDown size={14} className="text-[var(--muted)]" />
                                            )}
                                        </td>
                                    </tr>
                                    {/* Expanded expense details */}
                                    {expandedRows.has(i) && row.expense_details.length > 0 && (
                                        <tr className="bg-red-500/5 border-b border-[var(--border)]">
                                            <td colSpan={8} className="px-6 py-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Gider Detayları</p>
                                                    {row.expense_details.map((exp, j) => (
                                                        <div key={j} className="flex items-center justify-between bg-[var(--card)] rounded-xl px-4 py-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="bg-red-500/10 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-full">
                                                                    {exp.category || "Genel"}
                                                                </span>
                                                                <span className="text-sm text-[var(--foreground)] font-bold">
                                                                    {exp.description || "-"}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-black text-red-400">₺{fmt(exp.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        {/* Totals footer */}
                        {breakdown && breakdown.rows.length > 0 && (
                            <tfoot>
                                <tr className="bg-[var(--background)] border-t-2 border-[var(--border)]">
                                    <td className="px-4 py-3 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Toplam</td>
                                    <td className="px-4 py-3 text-right font-black text-blue-400">₺{fmt(breakdown.totals.revenue)}</td>
                                    <td className="px-4 py-3 hidden md:table-cell"></td>
                                    <td className="px-4 py-3 hidden md:table-cell"></td>
                                    <td className="px-4 py-3 hidden md:table-cell"></td>
                                    <td className="px-4 py-3 text-right font-black text-red-400">₺{fmt(breakdown.totals.expenses)}</td>
                                    <td className={`px-4 py-3 text-right font-black ${breakdown.totals.net >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {breakdown.totals.net < 0 ? "-" : ""}₺{fmt(Math.abs(breakdown.totals.net))}
                                    </td>
                                    <td className="px-4 py-3"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Bottom Row - Top Products + Staff */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products */}
                <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">
                            {t("top_products")}
                        </h2>
                        <ShoppingBag size={20} className="text-[#eab308]" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {topProducts.length === 0 ? (
                            <p className="text-[var(--muted)] font-bold text-center py-10">{t("no_sales_today")}</p>
                        ) : topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] hover:border-[#eab308]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-[#eab308]/10 flex items-center justify-center text-[#eab308] font-black text-xs">{i + 1}</div>
                                    <div>
                                        <p className="text-[var(--foreground)] font-black text-sm uppercase">{p.name}</p>
                                        <p className="text-[var(--muted)] text-[10px] font-bold">{p.total_quantity} {t("units_sold")}</p>
                                    </div>
                                </div>
                                <p className="text-[#eab308] font-black text-sm italic">₺{fmt(p.total_revenue)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Staff Performance */}
                <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">
                            {t("staff_performance")}
                        </h2>
                        <Users size={20} className="text-[#eab308]" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {staffStats.length === 0 ? (
                            <p className="text-[var(--muted)] font-bold text-center py-10">{t("no_staff_data")}</p>
                        ) : staffStats.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] hover:border-[#eab308]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--border)] to-[var(--background)] flex items-center justify-center text-[var(--foreground)] font-black text-sm border border-[var(--border)]">
                                        {s.waiter_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[var(--foreground)] font-black text-sm uppercase">{s.waiter_name}</p>
                                        <p className="text-[var(--muted)] text-[10px] font-bold uppercase">{s.order_count} {t("orders_completed")}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[var(--foreground)] font-black text-sm italic">₺{fmt(s.total_sales)}</p>
                                    <div className="w-20 h-1 bg-[var(--border)] rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${Math.min((s.total_sales / (summary?.total_revenue || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

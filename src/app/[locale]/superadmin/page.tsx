"use client";

import React, { useState, useEffect } from "react";
import {
    TrendingUp, Users, ShoppingBag, Home,
    Loader2, ArrowUpRight, ArrowDownRight,
    Wallet, Receipt, Calculator, TrendingDown,
    ChevronDown, ChevronUp, CreditCard, Banknote, UtensilsCrossed,
    XCircle, Gift, BarChart3
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    reportService, DashboardStats, ChartDataPoint, DailySummary,
    DailyBreakdown, MonthlyAggregate
} from "@/services/reportService";
import { useTranslations } from "next-intl";

export default function SuperAdminDashboard() {
    const t = useTranslations("SuperAdmin");
    const { token } = useAuth();

    // Chart state
    const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
    const [chartMode, setChartMode] = useState<"preset" | "custom">("preset");
    const [chartDateFrom, setChartDateFrom] = useState("");
    const [chartDateTo, setChartDateTo] = useState("");

    // Breakdown state
    const [breakdownPeriod, setBreakdownPeriod] = useState<"week" | "month">("week");
    const [breakdownMode, setBreakdownMode] = useState<"preset" | "custom">("preset");
    const [breakdownDateFrom, setBreakdownDateFrom] = useState("");
    const [breakdownDateTo, setBreakdownDateTo] = useState("");

    // Monthly aggregate state
    const [monthlyData, setMonthlyData] = useState<MonthlyAggregate | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
        fetchMonthlyAggregate(selectedYear);
    }, [token]);

    useEffect(() => {
        if (token && chartMode === "preset") fetchChartData();
    }, [token, chartPeriod, chartMode]);

    useEffect(() => {
        if (token && breakdownMode === "preset") fetchBreakdown();
    }, [token, breakdownPeriod, breakdownMode]);

    useEffect(() => {
        if (token) fetchMonthlyAggregate(selectedYear);
    }, [token, selectedYear]);

    const fetchOverview = async () => {
        try {
            const res = await reportService.getDashboardStats(token!);
            if (res.success) setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchChartData = async (from?: string, to?: string) => {
        try {
            const res = (from && to)
                ? await reportService.getRevenueChartData(token!, undefined, from, to)
                : await reportService.getRevenueChartData(token!, chartPeriod);
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

    const fetchBreakdown = async (from?: string, to?: string) => {
        try {
            const res = (from && to)
                ? await reportService.getDailyBreakdown(token!, undefined, from, to)
                : await reportService.getDailyBreakdown(token!, breakdownPeriod);
            if (res.success) setBreakdown(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMonthlyAggregate = async (year: number) => {
        try {
            const res = await reportService.getMonthlyAggregate(token!, year);
            if (res.success) setMonthlyData(res.data);
        } catch (err) { console.error(err); }
    };

    const toggleRow = (i: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const dashboardCards = [
        {
            title: t("today_revenue"),
            value: stats ? `₺${fmt(stats.today.revenue)}` : "₺0",
            icon: TrendingUp,
            badge: stats ? `${stats.today.revenue_change >= 0 ? "+" : ""}${stats.today.revenue_change}%` : "0%",
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
            badge: stats ? `${stats.today.count_change >= 0 ? "+" : ""}${stats.today.count_change}%` : "0%",
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
        {
            title: t("avg_ticket"),
            value: stats?.today.avg_ticket ? `₺${fmt(stats.today.avg_ticket)}` : "₺0",
            icon: Receipt,
            badge: stats?.today.avg_ticket_change !== undefined
                ? `${stats.today.avg_ticket_change >= 0 ? "+" : ""}${stats.today.avg_ticket_change}%`
                : "0%",
            badgeColor: (stats?.today.avg_ticket_change ?? 0) >= 0 ? "text-green-500" : "text-red-500",
            badgeBg: (stats?.today.avg_ticket_change ?? 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10",
            trend: (stats?.today.avg_ticket_change ?? 0) >= 0 ? "up" : "down"
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

    // Monthly chart helpers
    const monthlyRevenues = monthlyData?.months.map(m => m.revenue) ?? [];
    const monthlyExpenses = monthlyData?.months.map(m => m.expenses) ?? [];
    const monthlyNets = monthlyData?.months.map(m => m.net) ?? [];
    const monthlyMax = Math.max(...monthlyRevenues, ...monthlyExpenses, 100);
    const monthlyMin = Math.min(...monthlyNets, 0);
    const monthlyRange = monthlyMax - monthlyMin || 1;
    const yearOptions = [selectedYear, selectedYear - 1, selectedYear - 2];

    const dateInputClass = "bg-[var(--background)] border border-[var(--border)] rounded-[12px] py-1.5 px-2.5 text-[10px] font-black focus:border-[#eab308] outline-none";

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

            {/* Stats Grid — 5 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 lg:grid-cols-3 gap-6">
                {dashboardCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i}
                            className="bg-[var(--card)] rounded-[24px] p-6 border border-[var(--border)]/50 flex flex-col gap-5 transition-transform hover:scale-[1.02] duration-300 shadow-lg relative overflow-hidden group">
                            <div className="flex items-start justify-between relative z-10">
                                <div className="w-12 h-12 rounded-[16px] bg-[#eab308]/10 flex items-center justify-center group-hover:bg-[#eab308]/20 transition-colors">
                                    <Icon size={22} className="text-[#eab308]" />
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${stat.badgeBg} ${stat.badgeColor}`}>
                                    {stat.trend === "up" && <ArrowUpRight size={10} />}
                                    {stat.trend === "down" && <ArrowDownRight size={10} />}
                                    {stat.badge}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 relative z-10">
                                <span className="text-[var(--muted)] text-[10px] font-black tracking-[0.2em] uppercase">{stat.title}</span>
                                <span className="text-3xl font-black text-[var(--foreground)] italic">{stat.value}</span>
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
                                {chartMode === "preset"
                                    ? (chartPeriod === "week" ? t("last_7_days") : t("last_30_days"))
                                    : (chartDateFrom && chartDateTo ? `${chartDateFrom} – ${chartDateTo}` : t("custom_range"))}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
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
                                {(["week", "month"] as const).map(p => (
                                    <button key={p} onClick={() => { setChartPeriod(p); setChartMode("preset"); }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${chartMode === "preset" && chartPeriod === p ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                                        {p === "week" ? t("weekly_short") : t("monthly_short")}
                                    </button>
                                ))}
                                <button onClick={() => setChartMode("custom")}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${chartMode === "custom" ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                                    {t("custom_range")}
                                </button>
                            </div>
                            {/* Custom date inputs */}
                            {chartMode === "custom" && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input type="date" value={chartDateFrom} onChange={e => setChartDateFrom(e.target.value)} className={dateInputClass} />
                                    <span className="text-[var(--muted)] text-[10px] font-black">–</span>
                                    <input type="date" value={chartDateTo} onChange={e => setChartDateTo(e.target.value)} className={dateInputClass} />
                                    <button onClick={() => fetchChartData(chartDateFrom, chartDateTo)}
                                        disabled={!chartDateFrom || !chartDateTo}
                                        className="bg-[#eab308] text-black px-3 py-1.5 rounded-[10px] text-[10px] font-black hover:opacity-90 disabled:opacity-40 transition-all">
                                        {t("apply_filter")}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full relative z-10">
                        <div className="flex gap-2">
                            <div className="flex flex-col justify-between h-[280px] pr-2 shrink-0">
                                {yLabels.map((v, i) => (
                                    <span key={i} className="text-[9px] font-black text-[var(--muted)] text-right leading-none">
                                        ₺{v >= 1000 ? `${Math.round(v / 1000)}K` : Math.round(v)}
                                    </span>
                                ))}
                            </div>
                            <div className="flex-1">
                                <svg viewBox="0 0 800 300" className="w-full h-[280px]" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />
                                            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={i} x1="0" y1={20 + i * 55} x2="800" y2={20 + i * 55}
                                            stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                                    ))}
                                    {minVal < 0 && (
                                        <line x1="0" y1={260 - ((0 - minVal) / range) * 220 + 20} x2="800"
                                            y2={260 - ((0 - minVal) / range) * 220 + 20}
                                            stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                                    )}
                                    {chartData.length > 1 && (
                                        <>
                                            <polyline fill="none" stroke="#eab308" strokeWidth="3"
                                                strokeLinecap="round" strokeLinejoin="round" points={points} />
                                            <path d={`M 10,280 L ${points} L 790,280 Z`} fill="url(#chartGlow)" />
                                            {chartData.map((d, i) => {
                                                const x = (i / (chartData.length - 1)) * 780 + 10;
                                                const v = activeChart === "revenue" ? d.value : (d.net ?? 0);
                                                const y = 260 - ((v - minVal) / range) * 220 + 20;
                                                return <circle key={i} cx={x} cy={y} r="4" fill="#eab308" stroke="var(--card)" strokeWidth="2" />;
                                            })}
                                        </>
                                    )}
                                    {chartData.length === 0 && (
                                        <text x="400" y="150" textAnchor="middle" fill="var(--muted)" fontSize="14" fontWeight="bold">Veri yok</text>
                                    )}
                                </svg>
                                <div className="flex justify-between mt-2 px-1">
                                    {chartData
                                        .filter((_, i) => chartData.length <= 7 || i % Math.ceil(chartData.length / 7) === 0 || i === chartData.length - 1)
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
                    <div className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest -mb-2">Bugün</div>
                    <div className="flex flex-col gap-3">
                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Wallet size={18} /></div>
                                <p className="text-[10px] font-black text-[var(--muted)] uppercase">{t("total_revenue")}</p>
                            </div>
                            <p className="text-base font-black text-[var(--foreground)]">₺{fmt(summary?.total_revenue ?? 0)}</p>
                        </div>
                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Receipt size={18} /></div>
                                <p className="text-[10px] font-black text-[var(--muted)] uppercase">{t("total_cogs")}</p>
                            </div>
                            <p className="text-base font-black text-orange-500">-₺{fmt(summary?.total_cogs ?? 0)}</p>
                        </div>
                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><Calculator size={18} /></div>
                                <p className="text-[10px] font-black text-[var(--muted)] uppercase">{t("total_expenses")}</p>
                            </div>
                            <p className="text-base font-black text-red-500">-₺{fmt(summary?.total_expenses ?? 0)}</p>
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black text-[var(--muted)] uppercase">Brüt Kâr</span>
                            <span className={`text-sm font-black ${(summary?.gross_profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                ₺{fmt(summary?.gross_profit ?? 0)}
                            </span>
                        </div>
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
                                    {(summary.cancel_total ?? 0) > 0 && (
                                        <span className="bg-red-500/10 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <XCircle size={9} /> {t("cancelled")} ₺{fmt(summary.cancel_total!)}
                                        </span>
                                    )}
                                    {(summary.treat_total ?? 0) > 0 && (
                                        <span className="bg-orange-500/10 text-orange-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Gift size={9} /> {t("treated")} ₺{fmt(summary.treat_total!)}
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
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">Günlük Gelir & Gider Tablosu</h2>
                        <p className="text-[var(--muted)] text-sm font-bold mt-0.5">Tarih bazlı kazanç ve gider dökümü</p>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                        <div className="flex gap-1 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
                            {(["week", "month"] as const).map(p => (
                                <button key={p} onClick={() => { setBreakdownPeriod(p); setBreakdownMode("preset"); }}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${breakdownMode === "preset" && breakdownPeriod === p ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                                    {p === "week" ? "Son 7 Gün" : "Son 30 Gün"}
                                </button>
                            ))}
                            <button onClick={() => setBreakdownMode("custom")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${breakdownMode === "custom" ? "bg-[#eab308] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                                {t("custom_range")}
                            </button>
                        </div>
                        {breakdownMode === "custom" && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <input type="date" value={breakdownDateFrom} onChange={e => setBreakdownDateFrom(e.target.value)} className={dateInputClass} />
                                <span className="text-[var(--muted)] text-[10px] font-black">–</span>
                                <input type="date" value={breakdownDateTo} onChange={e => setBreakdownDateTo(e.target.value)} className={dateInputClass} />
                                <button onClick={() => fetchBreakdown(breakdownDateFrom, breakdownDateTo)}
                                    disabled={!breakdownDateFrom || !breakdownDateTo}
                                    className="bg-[#eab308] text-black px-3 py-1.5 rounded-[10px] text-[10px] font-black hover:opacity-90 disabled:opacity-40 transition-all">
                                    {t("apply_filter")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

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
                                <tr><td colSpan={8} className="text-center py-10 text-[var(--muted)] font-bold">Veri bulunamadı</td></tr>
                            )}
                            {breakdown?.rows.map((row, i) => (
                                <React.Fragment key={i}>
                                    <tr
                                        className={`border-b border-[var(--border)] transition-colors ${row.expense_details.length > 0 ? "cursor-pointer hover:bg-[var(--background)]" : ""} ${expandedRows.has(i) ? "bg-[var(--background)]" : ""}`}
                                        onClick={() => row.expense_details.length > 0 && toggleRow(i)}>
                                        <td className="px-4 py-3 font-black text-[var(--foreground)] text-sm">{row.date}</td>
                                        <td className="px-4 py-3 text-right font-black text-blue-400">{row.revenue > 0 ? `₺${fmt(row.revenue)}` : <span className="text-[var(--muted)]">-</span>}</td>
                                        <td className="px-4 py-3 text-right font-bold text-[var(--muted)] text-xs hidden md:table-cell">{row.cash > 0 ? `₺${fmt(row.cash)}` : "-"}</td>
                                        <td className="px-4 py-3 text-right font-bold text-[var(--muted)] text-xs hidden md:table-cell">{row.card > 0 ? `₺${fmt(row.card)}` : "-"}</td>
                                        <td className="px-4 py-3 text-right font-bold text-[var(--muted)] text-xs hidden md:table-cell">{row.meal > 0 ? `₺${fmt(row.meal)}` : "-"}</td>
                                        <td className="px-4 py-3 text-right font-black text-red-400">
                                            {row.expenses > 0
                                                ? <span className="flex items-center justify-end gap-1">₺{fmt(row.expenses)}{row.expense_details.length > 0 && <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 text-[8px] flex items-center justify-center font-black">{row.expense_details.length}</span>}</span>
                                                : <span className="text-[var(--muted)]">-</span>}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-black text-sm ${row.net >= 0 ? "text-green-400" : "text-red-400"}`}>
                                            {row.net !== 0 ? `${row.net < 0 ? "-" : ""}₺${fmt(Math.abs(row.net))}` : <span className="text-[var(--muted)]">-</span>}
                                        </td>
                                        <td className="px-4 py-3">{row.expense_details.length > 0 && (expandedRows.has(i) ? <ChevronUp size={14} className="text-[var(--muted)]" /> : <ChevronDown size={14} className="text-[var(--muted)]" />)}</td>
                                    </tr>
                                    {expandedRows.has(i) && row.expense_details.length > 0 && (
                                        <tr className="bg-red-500/5 border-b border-[var(--border)]">
                                            <td colSpan={8} className="px-6 py-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Gider Detayları</p>
                                                    {row.expense_details.map((exp, j) => (
                                                        <div key={j} className="flex items-center justify-between bg-[var(--card)] rounded-xl px-4 py-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="bg-red-500/10 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-full">{exp.category || "Genel"}</span>
                                                                <span className="text-sm text-[var(--foreground)] font-bold">{exp.description || "-"}</span>
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

            {/* Aylık Özet */}
            <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <BarChart3 size={20} className="text-[#eab308]" />
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">{t("monthly_overview")}</h2>
                    </div>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-[10px] font-black focus:border-[#eab308] outline-none appearance-none">
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {monthlyData ? (
                    <>
                        {/* Bar chart */}
                        <div className="w-full overflow-x-auto">
                            <div style={{ minWidth: 600 }}>
                                <svg viewBox="0 0 840 220" className="w-full" preserveAspectRatio="none">
                                    {/* Grid lines */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={i} x1="40" y1={10 + i * 40} x2="840" y2={10 + i * 40}
                                            stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                                    ))}
                                    {/* Y-axis labels */}
                                    {[monthlyMax, monthlyMax * 0.75, monthlyMax * 0.5, monthlyMax * 0.25, 0].map((v, i) => (
                                        <text key={i} x="35" y={14 + i * 40} textAnchor="end"
                                            fill="var(--muted)" fontSize="8" fontWeight="900">
                                            {v >= 1000 ? `₺${Math.round(v / 1000)}K` : `₺${Math.round(v)}`}
                                        </text>
                                    ))}
                                    {/* Bars */}
                                    {monthlyData.months.map((m, i) => {
                                        const slotW = 66;
                                        const slotX = 45 + i * slotW;
                                        const barW = 14;
                                        const chartH = 160;

                                        const revH = Math.max((m.revenue / monthlyRange) * chartH, 0);
                                        const expH = Math.max((m.expenses / monthlyRange) * chartH, 0);
                                        const netH = Math.max(Math.abs(m.net) / monthlyRange * chartH, 0);
                                        const netIsNeg = m.net < 0;
                                        const baseY = 170;

                                        return (
                                            <g key={i}>
                                                {/* Revenue bar */}
                                                <rect x={slotX} y={baseY - revH} width={barW} height={revH}
                                                    fill="#eab308" opacity={0.8} rx="2" />
                                                {/* Expense bar */}
                                                <rect x={slotX + barW + 2} y={baseY - expH} width={barW} height={expH}
                                                    fill="#ef4444" opacity={0.7} rx="2" />
                                                {/* Net bar */}
                                                <rect
                                                    x={slotX + (barW + 2) * 2}
                                                    y={netIsNeg ? baseY : baseY - netH}
                                                    width={barW} height={netH}
                                                    fill={netIsNeg ? "#ef4444" : "#22c55e"} opacity={0.75} rx="2" />
                                                {/* Month label */}
                                                <text x={slotX + barW + 8} y={185} textAnchor="middle"
                                                    fill="var(--muted)" fontSize="8" fontWeight="900">
                                                    {m.label.slice(0, 3).toUpperCase()}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                                {/* Legend */}
                                <div className="flex items-center justify-center gap-6 mt-2">
                                    {[
                                        { color: "#eab308", label: t("year_total_revenue") },
                                        { color: "#ef4444", label: t("year_total_expenses") },
                                        { color: "#22c55e", label: t("year_net") },
                                    ].map(({ color, label }) => (
                                        <div key={label} className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.8 }} />
                                            <span className="text-[9px] font-black text-[var(--muted)] uppercase">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Year totals */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                {
                                    label: t("year_total_revenue"),
                                    value: monthlyData.months.reduce((s, m) => s + m.revenue, 0),
                                    color: "text-blue-400"
                                },
                                {
                                    label: t("year_total_expenses"),
                                    value: monthlyData.months.reduce((s, m) => s + m.expenses, 0),
                                    color: "text-red-400"
                                },
                                {
                                    label: t("year_net"),
                                    value: monthlyData.months.reduce((s, m) => s + m.net, 0),
                                    color: monthlyData.months.reduce((s, m) => s + m.net, 0) >= 0 ? "text-green-400" : "text-red-400"
                                },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="bg-[var(--background)] rounded-2xl p-4 border border-[var(--border)] text-center">
                                    <p className="text-[10px] font-black text-[var(--muted)] uppercase mb-1">{label}</p>
                                    <p className={`text-xl font-black ${color}`}>
                                        {value < 0 ? "-" : ""}₺{fmt(Math.abs(value))}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="animate-spin text-[#eab308]" size={32} />
                    </div>
                )}
            </div>

            {/* Bottom Row - Top Products + Staff */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">{t("top_products")}</h2>
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

                <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">{t("staff_performance")}</h2>
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
                                        <div className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${Math.min((s.total_sales / (summary?.total_revenue || 1)) * 100, 100)}%` }} />
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

"use client";

import React, { useState, useEffect } from "react";
import {
    TrendingUp, Users, ShoppingBag, Home,
    Loader2, ArrowUpRight, ArrowDownRight,
    Wallet, Receipt, Calculator, Percent
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { reportService, DashboardStats, ChartDataPoint, DailySummary } from "@/services/reportService";

export default function SuperAdminDashboard() {
    const { token } = useAuth();
    const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [summary, setSummary] = useState<DailySummary | null>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [staffStats, setStaffStats] = useState<any[]>([]);

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

    const fetchOverview = async () => {
        try {
            const res = await reportService.getDashboardStats(token!);
            if (res.success) setStats(res.data);
        } catch (err) {
            console.error("Error fetching overview:", err);
        }
    };

    const fetchChartData = async () => {
        try {
            const res = await reportService.getRevenueChartData(token!, chartPeriod);
            if (res.success) setChartData(res.data);
        } catch (err) {
            console.error("Error fetching chart data:", err);
        }
    };

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await reportService.getDailySummary(token!);
            if (res.success) setSummary(res.data);
        } catch (err) {
            console.error("Error fetching summary:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopProducts = async () => {
        try {
            const res = await reportService.getTopProducts(token!);
            if (res.success) setTopProducts(res.data);
        } catch (err) {
            console.error("Error fetching top products:", err);
        }
    };

    const fetchStaffPerformance = async () => {
        try {
            const res = await reportService.getStaffPerformance(token!);
            if (res.success) setStaffStats(res.data);
        } catch (err) {
            console.error("Error fetching staff performance:", err);
        }
    };

    const dashboardCards = [
        {
            title: "BUGÜNKÜ CİRO",
            value: stats ? `₺${stats.today.revenue.toLocaleString('tr-TR')}` : "₺0",
            icon: TrendingUp,
            badge: stats ? `${stats.today.revenue_change >= 0 ? '+' : ''}${stats.today.revenue_change}%` : "0%",
            badgeColor: stats && stats.today.revenue_change >= 0 ? "text-green-500" : "text-red-500",
            badgeBg: stats && stats.today.revenue_change >= 0 ? "bg-green-500/10" : "bg-red-500/10",
            trend: stats && stats.today.revenue_change >= 0 ? "up" : "down"
        },
        {
            title: "AKTİF PERSONEL",
            value: stats ? stats.personnel_count.toString() : "0",
            icon: Users,
            badge: "Stabil",
            badgeColor: "text-blue-500",
            badgeBg: "bg-blue-500/10",
            trend: "none"
        },
        {
            title: "BUGÜNKÜ SİPARİŞ",
            value: stats ? stats.today.order_count.toString() : "0",
            icon: ShoppingBag,
            badge: stats ? `${stats.today.count_change >= 0 ? '+' : ''}${stats.today.count_change}%` : "0%",
            badgeColor: stats && stats.today.count_change >= 0 ? "text-green-500" : "text-red-500",
            badgeBg: stats && stats.today.count_change >= 0 ? "bg-green-500/10" : "bg-red-500/10",
            trend: stats && stats.today.count_change >= 0 ? "up" : "down"
        },
        {
            title: "MASA DOLULUK",
            value: stats ? `%${stats.occupancy_rate}` : "%0",
            icon: Home,
            badge: stats && stats.occupancy_rate > 50 ? "Yüksek" : "Normal",
            badgeColor: stats && stats.occupancy_rate > 50 ? "text-orange-500" : "text-blue-500",
            badgeBg: stats && stats.occupancy_rate > 50 ? "bg-orange-500/10" : "bg-blue-500/10",
            trend: "none"
        },
    ];

    if (loading && !stats) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-[var(--muted)]">
                <Loader2 className="animate-spin" size={40} />
                <p className="font-bold">Veriler yükleniyor...</p>
            </div>
        );
    }

    // Chart helpers
    const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 1000) : 1000;
    const points = chartData.map((d, i) => {
        const x = (i / (chartData.length - 1)) * 800;
        const y = 300 - (d.value / maxVal) * 250;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="w-full flex flex-col gap-10 pb-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[var(--foreground)] tracking-wide mb-1 uppercase italic">
                        YÖNETİM PANELİ
                    </h1>
                    <p className="text-[var(--muted)] text-[15px] font-medium font-bold">
                        İşletmenizin anlık performans ve finansal analizi
                    </p>
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-full px-4 py-2 flex items-center gap-2 text-xs font-black text-[#eab308]">
                    <div className="w-2 h-2 rounded-full bg-[#eab308] animate-pulse"></div>
                    CANLI VERİ AKTİF
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area */}
                <div className="lg:col-span-2 bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-8 relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h2 className="text-2xl font-black text-[var(--foreground)] tracking-wide mb-1 uppercase italic">
                                CİRO AKIŞI
                            </h2>
                            <p className="text-[var(--muted)] text-sm font-bold">
                                {chartPeriod === 'week' ? 'Son 7 Günlük' : 'Son 30 Günlük'} gelir dağılımı
                            </p>
                        </div>
                        <div className="flex gap-2 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
                            <button
                                onClick={() => setChartPeriod("week")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${chartPeriod === "week"
                                    ? "bg-[#eab308] text-[var(--background)]"
                                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                    }`}
                            >
                                HAFTALIK
                            </button>
                            <button
                                onClick={() => setChartPeriod("month")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${chartPeriod === "month"
                                    ? "bg-[#eab308] text-[var(--background)]"
                                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                    }`}
                            >
                                AYLIK
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-[300px] mt-4 relative z-10">
                        <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Grid lines */}
                            <line x1="0" y1="50" x2="800" y2="50" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="150" x2="800" y2="150" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="250" x2="800" y2="250" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />

                            {chartData.length > 1 && (
                                <>
                                    <polyline
                                        fill="none"
                                        stroke="#eab308"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={points}
                                        className="chart-path"
                                    />
                                    <path
                                        d={`M 0,300 L ${points} L 800,300 Z`}
                                        fill="url(#chartGlow)"
                                    />
                                </>
                            )}
                        </svg>

                        {/* X-Axis labels */}
                        <div className="flex justify-between mt-4">
                            {chartData.filter((_, i) => i % (chartPeriod === 'week' ? 1 : 5) === 0).map((d, i) => (
                                <span key={i} className="text-[10px] font-black text-[var(--muted)]">{d.label}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Profit & Loss Management */}
                <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                    <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">
                        KÂR-ZARAR ANALİZİ
                    </h2>

                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[var(--muted)] uppercase mb-0.5">TOPLAM CİRO</p>
                                    <p className="text-lg font-black text-[var(--foreground)]">₺{summary?.total_revenue.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[var(--muted)] uppercase mb-0.5">MALİYET (COGS)</p>
                                    <p className="text-lg font-black text-[var(--foreground)]">₺{summary?.total_cogs.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                    <Calculator size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[var(--muted)] uppercase mb-0.5">GİDERLER (EXPENSES)</p>
                                    <p className="text-lg font-black text-[var(--foreground)]">₺{summary?.total_expenses.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-[24px] border border-[var(--border)] mt-2 flex flex-col gap-2 ${(summary?.net_profit || 0) >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                            }`}>
                            <div className="flex justify-between items-center">
                                <p className="text-[12px] font-black text-[var(--muted)] uppercase tracking-widest">NET KÂR / ZARAR</p>
                                <div className={`p-1.5 rounded-lg ${(summary?.net_profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    <Percent size={18} />
                                </div>
                            </div>
                            <p className={`text-4xl font-black italic ${(summary?.net_profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                ₺{summary?.net_profit.toLocaleString('tr-TR')}
                            </p>
                            <p className="text-[10px] font-bold text-[var(--muted)] mt-2">
                                * Veriler bugünkü tüm işlemleri kapsamaktadır.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Extra Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                {/* Top Products */}
                <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">
                            EN ÇOK SATAN ÜRÜNLER (TOP 5)
                        </h2>
                        <ShoppingBag size={20} className="text-[#eab308]" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {topProducts.length === 0 ? (
                            <p className="text-[var(--muted)] font-bold text-center py-10">Bugün henüz satış yapılmadı.</p>
                        ) : topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] hover:border-[#eab308]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-[#eab308]/10 flex items-center justify-center text-[#eab308] font-black text-xs">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-[var(--foreground)] font-black text-sm uppercase">{p.name}</p>
                                        <p className="text-[var(--muted)] text-[10px] font-bold">{p.total_quantity} Adet Satıldı</p>
                                    </div>
                                </div>
                                <p className="text-[#eab308] font-black text-sm italic">₺{p.total_revenue.toLocaleString('tr-TR')}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Staff Performance */}
                <div className="bg-[var(--card)] rounded-[32px] p-8 border border-[var(--border)]/50 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-wider">
                            PERSONEL SATIŞ PERFORMANSI
                        </h2>
                        <Users size={20} className="text-[#eab308]" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {staffStats.length === 0 ? (
                            <p className="text-[var(--muted)] font-bold text-center py-10">Personel verisi bulunamadı.</p>
                        ) : staffStats.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] hover:border-[#eab308]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--border)] to-[var(--background)] flex items-center justify-center text-[var(--foreground)] font-black text-sm border border-[var(--border)]">
                                        {s.waiter_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[var(--foreground)] font-black text-sm uppercase">{s.waiter_name}</p>
                                        <p className="text-[var(--muted)] text-[10px] font-bold uppercase">{s.order_count} SİPARİŞ TAMAMLANDI</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[var(--foreground)] font-black text-sm italic">₺{s.total_sales.toLocaleString('tr-TR')}</p>
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

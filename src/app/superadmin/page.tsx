"use client";

import React, { useState } from "react";
import { TrendingUp, Users, ShoppingBag, Home } from "lucide-react";

export default function SuperAdminDashboard() {
    const [chartPeriod, setChartPeriod] = useState<"HAFTALIK" | "AYLIK">("HAFTALIK");

    const stats = [
        {
            title: chartPeriod === "HAFTALIK" ? "HAFTALIK TOPLAM" : "AYLIK TOPLAM",
            value: chartPeriod === "HAFTALIK" ? "₺174.300" : "₺685.120",
            icon: TrendingUp,
            badge: chartPeriod === "HAFTALIK" ? "+12%" : "+18%",
            badgeColor: "text-green-500",
            badgeBg: "bg-green-500/10",
        },
        {
            title: "AKTİF PERSONEL",
            value: "12",
            icon: Users,
            badge: "Stabil",
            badgeColor: "text-blue-500",
            badgeBg: "bg-blue-500/10",
        },
        {
            title: "BUGÜNKÜ SİPARİŞ",
            value: "142",
            icon: ShoppingBag,
            badge: "+5%",
            badgeColor: "text-green-500",
            badgeBg: "bg-green-500/10",
        },
        {
            title: "MASA DOLULUK",
            value: "%65",
            icon: Home,
            badge: "-2%",
            badgeColor: "text-red-500",
            badgeBg: "bg-red-500/10",
        },
    ];

    return (
        <div className="w-full flex flex-col gap-10 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-wide mb-1">
                    İSTATİSTİKLER
                </h1>
                <p className="text-[#a1a1aa] text-[15px] font-medium font-bold">
                    İşletmenizin {chartPeriod === "HAFTALIK" ? "haftalık" : "aylık"} performans özeti
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className="bg-[#18181b] rounded-[24px] p-6 border border-[#27272a]/50 flex flex-col gap-5 transition-transform hover:scale-[1.02] duration-300 shadow-lg"
                        >
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-[16px] bg-[#eab308]/10 flex items-center justify-center">
                                    <Icon size={22} className="text-[#eab308]" />
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${stat.badgeBg} ${stat.badgeColor}`}>
                                    {stat.badge}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[#a1a1aa] text-[11px] font-black tracking-[0.1em]">
                                    {stat.title}
                                </span>
                                <span className="text-3xl font-black text-white">
                                    {stat.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart Area */}
            <div className="bg-[#18181b] rounded-[32px] p-8 border border-[#27272a]/50 shadow-xl flex flex-col gap-8 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-wide mb-1">
                            {chartPeriod === "HAFTALIK" ? "HAFTALIK" : "AYLIK"} CİRO RAPORU
                        </h2>
                        <p className="text-[#71717a] text-sm font-bold">
                            Son {chartPeriod === "HAFTALIK" ? "7" : "30"} günlük gelir dağılımı
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setChartPeriod("HAFTALIK")}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${chartPeriod === "HAFTALIK"
                                ? "bg-[#eab308] text-[#0d0d0d] shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                : "bg-transparent text-[#a1a1aa] hover:bg-[#27272a]"
                                }`}
                        >
                            HAFTALIK
                        </button>
                        <button
                            onClick={() => setChartPeriod("AYLIK")}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${chartPeriod === "AYLIK"
                                ? "bg-[#eab308] text-[#0d0d0d] shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                : "bg-transparent text-[#a1a1aa] hover:bg-[#27272a]"
                                }`}
                        >
                            AYLIK
                        </button>
                    </div>
                </div>

                {/* SVG Chart Mockup */}
                <div className="w-full h-[300px] mt-4 relative z-10">
                    <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="none">
                        {/* Grid Lines */}
                        <line x1="0" y1="50" x2="800" y2="50" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="150" x2="800" y2="150" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="250" x2="800" y2="250" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Y-Axis Labels */}
                        <text x="0" y="45" fill="#52525b" fontSize="11" fontWeight="bold">₺35.000</text>
                        <text x="0" y="145" fill="#52525b" fontSize="11" fontWeight="bold">₺30.000</text>
                        <text x="0" y="245" fill="#52525b" fontSize="11" fontWeight="bold">₺25.000</text>

                        {/* Defs for Gradient */}
                        <defs>
                            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Animated Path & Area */}
                        {chartPeriod === "HAFTALIK" ? (
                            <g>
                                <path
                                    d="M 100 280 C 200 280, 250 200, 350 220 C 450 240, 500 130, 600 70 C 700 10, 750 100, 800 120 V 300 H 100 Z"
                                    fill="url(#chartGlow)"
                                />
                                <path
                                    d="M 100 280 C 200 280, 250 200, 350 220 C 450 240, 500 130, 600 70 C 700 10, 750 100, 800 120"
                                    fill="none"
                                    stroke="#eab308"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                                {/* Data Points */}
                                <circle cx="350" cy="220" r="5" fill="#0d0d0d" stroke="#eab308" strokeWidth="3" />
                                <circle cx="600" cy="70" r="5" fill="#0d0d0d" stroke="#eab308" strokeWidth="3" />
                                <circle cx="800" cy="120" r="5" fill="#0d0d0d" stroke="#eab308" strokeWidth="3" />
                            </g>
                        ) : (
                            <g>
                                <path
                                    d="M 100 250 C 200 220, 250 150, 350 120 C 450 90, 500 230, 600 170 C 700 110, 750 150, 800 90 V 300 H 100 Z"
                                    fill="url(#chartGlow)"
                                />
                                <path
                                    d="M 100 250 C 200 220, 250 150, 350 120 C 450 90, 500 230, 600 170 C 700 110, 750 150, 800 90"
                                    fill="none"
                                    stroke="#eab308"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                                {/* Data Points */}
                                <circle cx="350" cy="120" r="5" fill="#0d0d0d" stroke="#eab308" strokeWidth="3" />
                                <circle cx="600" cy="170" r="5" fill="#0d0d0d" stroke="#eab308" strokeWidth="3" />
                                <circle cx="800" cy="90" r="5" fill="#0d0d0d" stroke="#eab308" strokeWidth="3" />
                            </g>
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
}

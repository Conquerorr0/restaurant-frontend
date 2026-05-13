"use client";

import React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { BarChart3, UtensilsCrossed, LayoutGrid, Users, LogOut, ShieldCheck, Wallet, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations("SuperAdmin");
    const pathname = usePathname();
    const { logout } = useAuth();

    const navItems = [
        { name: t("nav_dashboard"), href: "/superadmin", icon: BarChart3 },
        { name: t("nav_menu"), href: "/superadmin/menu", icon: UtensilsCrossed },
        { name: t("nav_tables"), href: "/superadmin/masalar", icon: LayoutGrid },
        { name: t("nav_personnel"), href: "/superadmin/personel", icon: Users },
        { name: t("nav_sales"), href: "/superadmin/satislar", icon: TrendingUp },
        { name: t("nav_expenses"), href: "/superadmin/giderler", icon: Wallet },
    ];

    return (
        <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
            {/* Sidebar */}
            <aside className="w-[280px] flex flex-col justify-between py-10 px-6 sticky top-0 h-screen flex-shrink-0">
                <div>
                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-16">
                        <div className="w-16 h-16 bg-[#eab308] rounded-[20px] flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                            <ShieldCheck size={32} className="text-[var(--background)]" />
                        </div>
                        <h2 className="text-[#eab308] font-black text-xl tracking-[0.05em]">{t("super_admin")}</h2>
                        <p className="text-[10px] text-[var(--muted)] font-bold tracking-[0.2em] mt-1.5">{t("management_panel")}</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-5 py-4 rounded-[16px] transition-all duration-300 font-bold ${isActive
                                        ? "bg-[#eab308] text-[var(--background)] shadow-[0_4px_20px_rgba(234,179,8,0.2)]"
                                        : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? "text-[var(--background)]" : "text-[#eab308]"} />
                                    <span className="flex-1 text-[15px]">{item.name}</span>
                                    {isActive && <span className="text-sm font-black">{">"}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="flex items-center gap-3 text-[#ef4444] font-bold hover:text-red-400 transition-colors px-5 pt-8 mt-auto border-t border-[var(--card)]/50"
                >
                    <LogOut size={20} />
                    <span className="text-[15px]">{t("logout")}</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1100px] mx-auto w-full p-6 md:p-10 md:pt-16 min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

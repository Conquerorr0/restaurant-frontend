"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";

export default function LanguageToggle() {
    const [isOpen, setIsOpen] = useState(false);
    const [lang, setLang] = useState("TR");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: "TR", label: "Türkçe" },
        { code: "EN", label: "English" },
        { code: "AR", label: "العربية" }
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = languages.find(l => l.code === lang)?.label || lang;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 h-10 px-4 rounded-full transition-all duration-300 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
                style={{
                    background: "var(--card-alt)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                }}
            >
                <Globe size={18} />
                <span className="font-bold text-sm leading-none pt-0.5">{lang}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ml-1 opacity-70 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-44 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300"
                    style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)"
                    }}
                >
                    <div className="flex flex-col p-1">
                        {languages.map((l) => {
                            const isSelected = lang === l.code;
                            return (
                                <button
                                    key={l.code}
                                    onClick={() => {
                                        setLang(l.code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-between group relative`}
                                    style={{
                                        color: isSelected ? "var(--accent)" : "var(--foreground)",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--card-alt)"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                    <span className="relative z-10">{l.label}</span>
                                    <span style={{ color: "var(--muted)" }} className="text-[10px] tracking-widest relative z-10 font-black opacity-80">{l.code}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

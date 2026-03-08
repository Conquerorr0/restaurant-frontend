"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10" />;
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300"
            aria-label="Toggle Theme"
            title={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
            style={{
                background: "var(--card-alt)",
                border: "1px solid var(--border)",
                color: "var(--foreground)"
            }}
        >
            {theme === "dark" ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
        </button>
    );
}

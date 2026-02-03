"use client";

import { useTheme } from "./ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors duration-200"
        >
            <Sun
                className={`w-5 h-5 absolute inset-0 m-auto transition-all duration-200 ${theme === "light" ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                    }`}
            />
            <Moon
                className={`w-5 h-5 transition-all duration-200 ${theme === "dark" ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
                    }`}
            />
        </button>
    );
}

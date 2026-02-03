"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "./ThemeContext";

export default function Footer() {
  const { theme } = useTheme();

  const logoSrc = theme === "light"
    ? "/images/logo-light.png"
    : "/images/transparent logo for website copy 2.png";

  return (
    // No outer spacing or backgrounds; inherits page backdrop.
    <footer>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={logoSrc}
              alt="UW Blockchain Society logo"
              width={128}
              height={128}
              className="h-8 md:h-10 w-auto"
              unoptimized
              priority
            />

            <nav className="hidden md:flex items-center gap-6">
              <Link href="#about" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>About</Link>
              <Link href="#focus" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Focus</Link>
              <Link href="#events" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Events</Link>
              <Link href="#sponsors" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Sponsors</Link>
              <Link href="#team" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Team</Link>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSfxNK9CgnIwdQzpx3_ckLAjJc6RiyTZjzjYjmnLAaxzpDpYXA/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Apply</a>
            </nav>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-6 md:justify-end">
              <a href="mailto:blockchn@uw.edu" className="hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Contact</a>
              <a href="https://twitter.com/udubblockchain" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Twitter</a>
              <a href="https://www.instagram.com/uwblockchain/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Instagram</a>
            </div>
            <p className="text-xs md:text-right" style={{ color: "var(--text-secondary)" }}>© {new Date().getFullYear()} UW Blockchain Society. All rights reserved.</p>
          </div>
        </div>

        <div className="mt-8 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link href="#about" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>About</Link>
            <Link href="#focus" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Focus</Link>
            <Link href="#events" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Events</Link>
            <Link href="#sponsors" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Sponsors</Link>
            <Link href="#team" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Team</Link>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfxNK9CgnIwdQzpx3_ckLAjJc6RiyTZjzjYjmnLAaxzpDpYXA/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>Apply</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
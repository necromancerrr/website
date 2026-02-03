"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./ThemeContext";

// Floating, transparent navbar that overlays the hero with mobile full-screen menu
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isCareerPortal = pathname?.startsWith('/career-portal');
  const { theme } = useTheme();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const logoSrc = theme === "light"
    ? "/images/logo-light.png"
    : "/images/transparent logo for website copy 2.png";

  return (
    <>
      {/* Desktop/Tablet Navbar */}
      <nav
        className="sticky top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-3 backdrop-blur-md border-b"
        style={{
          backgroundColor: theme === "light" ? "rgba(248, 249, 250, 0.8)" : "rgba(0, 0, 0, 0.6)",
          borderColor: "var(--border)",
        }}
        aria-label="Primary"
      >
        {/* Brand Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              src={logoSrc}
              alt="UW Blockchain Society logo"
              width={1200}
              height={300}
              className="h-10 md:h-12 w-auto"
              unoptimized
              priority
            />
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10 font-medium" style={{ color: "var(--text-primary)" }}>
          {!isCareerPortal && (
            <>
              <Link href="https://uwfintech.org/" target="_blank" className="hover:text-[rgb(183,148,244)]">Research</Link>
              <Link href="/engineering" className="hover:text-[rgb(183,148,244)]">Engineering</Link>
              <Link href="/career-portal">Career Portal</Link>

              <Link
                href="https://docs.google.com/forms/d/e/1FAIpQLSfxNK9CgnIwdQzpx3_ckLAjJc6RiyTZjzjYjmnLAaxzpDpYXA/viewform?usp=dialog"
                target="_blank"
                className="text-white px-5 py-2 rounded-full font-semibold transition-opacity hover:opacity-95"
                style={{
                  backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                  boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                }}
              >
                Apply
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            style={{ color: "var(--text-primary)" }}
          >
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h18M4 13h18M4 20h18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Full-Screen Overlay Menu */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col items-center justify-center gap-10 text-3xl font-semibold transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {/* Close */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute top-6 right-8"
          style={{ color: "var(--text-primary)" }}
        >
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l14 14M20 6L6 20" />
          </svg>
        </button>

        {!isCareerPortal && (
          <>
            <Link href="https://uwfintech.org/" target="_blank" onClick={() => setOpen(false)} className="hover:text-[rgb(183,148,244)] transition-colors">Research</Link>
            <Link href="/engineering" onClick={() => setOpen(false)} className="hover:text-[rgb(183,148,244)] transition-colors">Engineering</Link>

            <Link
              href="https://docs.google.com/forms/d/e/1FAIpQLSfxNK9CgnIwdQzpx3_ckLAjJc6RiyTZjzjYjmnLAaxzpDpYXA/viewform?usp=dialog"
              target="_blank"
              onClick={() => setOpen(false)}
              className="text-white px-6 py-3 rounded-full mt-6 text-xl font-semibold transition-opacity hover:opacity-95"
              style={{
                backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
              }}
            >
              Apply
            </Link>
          </>
        )}
      </div>
    </>
  );
}


"use client";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeContext";

export default function Hero() {
  const { theme } = useTheme();

  const huskyImage = theme === "light"
    ? "/images/Husky-light.png"
    : "/images/Husky.png";

  return (
    <section id="home" className="relative pt-28 pb-16 lg:pt-24 lg:pb-20 lg:min-h-screen">
      {/* Right-anchored Husky across all breakpoints; overlap varies by width */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[80%] sm:w-[65%] md:w-[55%] lg:w-[65%] xl:w-[60%] 2xl:w-[55%]"
        style={{
          backgroundImage: `url(${huskyImage})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
          backgroundSize: "contain",
          opacity: 1,
        }}
      />
      {/* Atmospheric accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 -top-24 h-64 bg-radial-fade" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="grid lg:grid-cols-2 gap-10 items-center lg:min-h-screen"
        >
          <div className="lg:-translate-y-8 xl:-translate-y-12 2xl:-translate-y-16">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-tight" style={{ color: "var(--text-primary)" }}>
              Builder culture at UW —
              <span className="block text-electric">Blockchain, boldly.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg" style={{ color: "var(--text-secondary)" }}>
              Student-led, high-quality education and hands-on innovation. A modern hub for hackers, researchers, and builders across campuses.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a
                href="#focus"
                className="rounded-full text-white px-5 py-2 font-semibold transition-opacity hover:opacity-95"
                style={{
                  backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                  boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                }}
              >
                Explore
              </a>
              <a
                href="#events"
                className="rounded-full px-5 py-2 hover:border-electric hover:text-electric transition-colors"
                style={{
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                Events
              </a>
            </div>
          </div>
          {/* Keep right column empty to preserve layout spacing */}
          <div className="relative" />
        </motion.div>
      </div>
    </section>
  );
}
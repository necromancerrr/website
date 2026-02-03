"use client";
import { motion } from "framer-motion";
import { leaders, faculty, alumni } from "@/data/team";

function Avatar({ name, image }) {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div
      className="relative h-24 w-24 mx-auto rounded-full flex items-center justify-center"
      style={{
        backgroundColor: "var(--surface)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
      }}
    >
      {/* Use a plain img to avoid Next public path constraints; fallback to initials via onError */}
      <img
        src={image}
        alt={name}
        className="absolute inset-0 h-full w-full rounded-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span className="text-xl font-heading">{initial}</span>
    </div>
  );
}

function PersonCard({ name, role = [], details = [], image }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center rounded-xl p-6 hover:border-electric transition"
      style={{
        backgroundColor: "var(--surface)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
      }}
    >
      <Avatar name={name} image={image} />
      <h5 className="mt-3 font-heading text-lg" style={{ color: "var(--text-primary)" }}>{name}</h5>
      {role.map((r) => (
        <p key={r} className="text-sm" style={{ color: "var(--text-secondary)" }}>{r}</p>
      ))}
      {details?.length ? (
        <div className="mt-2">
          {details.map((d) => (
            <p key={d} className="text-xs" style={{ color: "var(--text-secondary)" }}>{d}</p>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

function Section({ title, items }) {
  return (
    <section className="mt-10">
      <h3 className="font-heading text-2xl mb-4" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => (
          <PersonCard key={p.name} {...p} />
        ))}
      </div>
    </section>
  );
}

export default function TeamSection({ className = "" }) {
  return (
    <section id="team" className={`py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl" style={{ color: "var(--text-primary)" }}>Meet Our Team</h2>
          <p className="mt-3" style={{ color: "var(--text-secondary)" }}>Students and advisors pushing blockchain forward at UW.</p>
        </div>
        <section className="mt-10">
          <h3 className="font-heading text-2xl mb-4" style={{ color: "var(--text-primary)" }}>Contact</h3>
          <div
            className="rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            style={{
              backgroundColor: "var(--surface)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border)",
            }}
          >
            <div className="max-w-2xl">
              <p className="font-heading text-xl" style={{ color: "var(--text-primary)" }}>Do you have a question?</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Want to partner, sponsor, or collaborate with UW Blockchain? Send us an email and we'll get back to you.
              </p>
            </div>
            <a
              href="mailto:blockchn@uw.edu"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold text-white border border-electric/40 bg-electric/10 hover:bg-electric/20 hover:border-electric transition-colors"
              aria-label="Email UW Blockchain at blockchn@uw.edu"
            >
              Contact us
            </a>
          </div>
        </section>

        <Section title="Leadership" items={leaders} />
        <Section title="Faculty Advisor" items={faculty} />
        <Section title="Alumni Network" items={alumni} />
      </div>
    </section>
  );
}

"use client";
import { motion } from "framer-motion";
import { useState } from "react";

export default function CareerPortalPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen pt-28 lg:pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 -top-24 h-64 bg-radial-fade" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]"
        >
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-4">
                Career Portal
                <span className="block text-electric">Sign In</span>
              </h1>
              <p className="text-muted text-lg">
                Access exclusive opportunities and connect with industry partners.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow"
            >
              <form className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="your.email@uw.edu"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-electric focus:border-electric"
                    />
                    <span className="ml-2 text-sm text-muted">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-electric hover:text-electric-alt transition-colors">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95"
                  style={{
                    backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                    boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                  }}
                >
                  Sign In
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted text-sm">
                  Don't have an account?{" "}
                  <a href="#" className="text-electric hover:text-electric-alt transition-colors">
                    Request access
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

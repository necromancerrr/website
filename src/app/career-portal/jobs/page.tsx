"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";
import type { Session } from "@supabase/supabase-js";

export default function JobsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [numOfJobs, setNumOfJobs] = useState(0)

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
    };

    getSession();
  }, []);

  if (!user) {
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
            className="text-center py-24"
          >
            <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-4">
              Job Opportunities
              <span className="block text-electric">Sign In Required</span>
            </h1>
            <p className="text-muted text-lg mb-8">
              Please sign in to access our community opportunities.
            </p>
            <button
              onClick={() => router.push("/career-portal")}
              className="rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95"
              style={{
                backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
              }}
            >
              Sign In to Career Portal
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

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
        >
          {/* Job Listings */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="text-center py-12"
          >
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-12 accent-glow">
              {/* TODO: fetch API from Supabase for job postings from there */}
              {numOfJobs == 0 && (
                <p>We will update this page soon.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

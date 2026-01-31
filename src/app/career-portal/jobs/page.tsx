"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";
import { usePrivy } from "@privy-io/react-auth";
import type { Session } from "@supabase/supabase-js";
import type { Job, CareerField } from "@/types/career";
import { CAREER_FIELD_LABELS, CAREER_FIELD_OPTIONS } from "@/types/career";

export default function JobsPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);

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

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState<CareerField[]>([]);

  // Check if user is authenticated via either Supabase or Privy
  const isAuthenticated = user || (ready && authenticated);

  // Fetch jobs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
    }
  }, [isAuthenticated]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const result = await response.json();
      if (response.ok) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCareerField = (field: CareerField) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const clearFilters = () => {
    setSelectedFields([]);
  };

  const filteredJobs = selectedFields.length > 0
    ? jobs.filter(job => 
        job.career_fields?.some(f => selectedFields.includes(f))
      )
    : jobs;

  if (!isAuthenticated) {
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

  if (loading) {
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
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-12 accent-glow text-center">
              <p className="text-muted">Loading job opportunities...</p>
            </div>
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

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-4">
              Job Opportunities
              <span className="block text-electric">Latest Postings</span>
            </h1>
            <p className="text-muted text-lg">
              Career opportunities curated for the UW Blockchain community.
            </p>
          </motion.div>

          {/* Career Field Filters */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 accent-glow mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Filter by Career Field</h2>
              {selectedFields.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-electric hover:text-electric-alt transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {CAREER_FIELD_OPTIONS.map((field) => (
                <button
                  key={field}
                  onClick={() => toggleCareerField(field)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedFields.includes(field)
                      ? "bg-electric text-white"
                      : "bg-white/10 text-muted hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {CAREER_FIELD_LABELS[field]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Job Listings */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow"
          >
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted mb-4">
                  {selectedFields.length > 0 
                    ? "No jobs match your selected filters."
                    : "No job opportunities available at the moment."}
                </p>
                <p className="text-sm text-muted">
                  {selectedFields.length > 0 
                    ? "Try adjusting your filters."
                    : "Check back soon for new postings!"}
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredJobs.map((job, index) => (
                  <motion.li
                    key={job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0"
                  >
                    <span className="text-electric mt-1 text-lg">•</span>
                    <div className="flex-1">
                      <div className="text-white">
                        {job.company && <span className="font-semibold">{job.company}</span>}
                        {job.company && job.position && " is hiring "}
                        {job.position && <span className="font-medium">{job.position}</span>}
                        {!job.company && !job.position && "Job opportunity"}
                      </div>
                      
                      {/* Career Field Tags */}
                      {job.career_fields && job.career_fields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.career_fields.map((field) => (
                            <span
                              key={field}
                              className="px-2 py-0.5 bg-electric/20 text-electric text-xs rounded-full"
                            >
                              {CAREER_FIELD_LABELS[field]}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2">
                        <a
                          href={job.job_posting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-electric hover:opacity-80 text-sm transition-opacity"
                        >
                          Apply here →
                        </a>
                        {job.experience_level && (
                          <span className="px-2 py-1 bg-white/10 rounded text-xs text-muted">
                            {job.experience_level}
                          </span>
                        )}
                      </div>
                      {job.notes && (
                        <div className="mt-2 text-sm text-muted bg-white/5 rounded p-2">
                          <strong>Note:</strong> {job.notes}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-muted text-sm">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} 
              {selectedFields.length > 0 && ` (filtered from ${jobs.length})`}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

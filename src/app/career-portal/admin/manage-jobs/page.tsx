"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-admin";
import { Plus, ArrowLeft, Search, ArrowUpDown } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { Job, CareerField } from "@/types/career";
import { CAREER_FIELD_OPTIONS, CAREER_FIELD_LABELS } from "@/types/career";

export default function ManageJobsPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Job management state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    job_posting_url: "",
    experience_level: "",
    notes: "",
    career_fields: [] as CareerField[],
    referral_available: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const stats = {
    total: jobs.length,
  };

  // Check for existing session on mount
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Authorization check for existing sessions
      if (session?.user && session.user.email !== "blockchn@uw.edu") {
        await supabase.auth.signOut();
        setError("Access denied. Unauthorized email address.");
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Authorization check for auth state changes
      if (
        event === "SIGNED_IN" &&
        session?.user &&
        session.user.email !== "blockchn@uw.edu"
      ) {
        await supabase.auth.signOut();
        setError("Access denied. Unauthorized email address.");
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") {
        setEmail("");
        setPassword("");
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch jobs when authenticated
  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      console.log('Fetching jobs from API...');
      const response = await fetch("/api/jobs");
      const result = await response.json();
      console.log('API response:', { status: response.status, data: result });
      if (response.ok) {
        setJobs(result.data || []);
        console.log('Jobs loaded:', result.data?.length || 0);
      } else {
        console.error('API error:', result.error);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const toggleCareerField = (field: CareerField) => {
    setFormData(prev => ({
      ...prev,
      career_fields: prev.career_fields.includes(field)
        ? prev.career_fields.filter(f => f !== field)
        : [...prev.career_fields, field]
    }));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    console.log('Creating job with data:', formData);
    console.log('Referral available value:', formData.referral_available, 'Type:', typeof formData.referral_available);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setFormError(result.error || "Failed to create job posting");
        return;
      }

      setFormData({
        company: "",
        position: "",
        job_posting_url: "",
        experience_level: "",
        notes: "",
        career_fields: [],
        referral_available: false,
      });
      setShowCreateModal(false);
      fetchJobs(); // Refresh the list
    } catch (error) {
      setFormError("Failed to create job posting");
    } finally {
      setFormLoading(false);
    }
  };

  const startEditJob = (job: Job) => {
    setEditingJob(job);
    setFormData({
      company: job.company || "",
      position: job.position || "",
      job_posting_url: job.job_posting_url || "",
      experience_level: job.experience_level || "",
      notes: job.notes || "",
      career_fields: job.career_fields || [],
      referral_available: job.referral_available || false,
    });
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setFormError(null);
    setFormLoading(true);

    try {
      console.log('Updating job ID:', editingJob.id);
      console.log('Form data:', JSON.stringify(formData, null, 2));
      
      const response = await fetch(`/api/jobs/${editingJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log('Update response:', { status: response.status, result });

      if (!response.ok) {
        console.error('Update failed:', result);
        setFormError(result.error || result.details || result.code || "Failed to update job posting");
        return;
      }

      setEditingJob(null);
      resetForm();
      fetchJobs();
    } catch (error) {
      console.error('Update error:', error);
      setFormError("Failed to update job posting");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company: "",
      position: "",
      job_posting_url: "",
      experience_level: "",
      notes: "",
      career_fields: [],
      referral_available: false,
    });
    setShowCreateModal(false);
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchJobs(); // Refresh the list
      } else {
        const result = await response.json();
        alert(result.error || "Failed to delete job posting");
      }
    } catch (error) {
      alert("Failed to delete job posting");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user && data.user.email !== "blockchn@uw.edu") {
        // Sign out immediately if not authorized email
        await supabase.auth.signOut();
        setError("Access denied. Unauthorized email address.");
      } else {
        // Successful sign in with authorized email
        setUser(data.user);
        setSession(data.session);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "draft":
        return "text-yellow-400";
      case "expired":
        return "text-red-400";
      default:
        return "text-muted";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-400/10 border-green-400/20";
      case "draft":
        return "bg-yellow-400/10 border-yellow-400/20";
      case "expired":
        return "bg-red-400/10 border-red-400/20";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Internship":
        return "text-blue-400";
      case "Full Time":
        return "text-green-400";
      case "Contract":
        return "text-purple-400";
      default:
        return "text-muted";
    }
  };

  // Show sign-in form if not authenticated
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
            className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]"
          >
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-4">
                  Manage Jobs
                  <span className="block text-electric">Sign In</span>
                </h1>
                <p className="text-muted text-lg">
                  Access job posting management dashboard.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow"
              >
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Admin Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      placeholder="admin@uwblockchain.org"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Admin Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      placeholder="•••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage:
                        "linear-gradient(117.96deg, #6f58da, #5131e7)",
                      boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                    }}
                  >
                    {loading ? "Signing In..." : "Access Job Management"}
                  </button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show manage jobs dashboard if authenticated
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
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-4">
                Job Management
                <span className="block text-electric">Manage Postings</span>
              </h1>
              <p className="text-muted text-lg">
                Create, edit, and manage job postings for the UW Blockchain
                community.
              </p>
              {user?.email && (
                <p className="text-electric text-sm mt-2">
                  Signed in as {user.email}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href="/career-portal/admin"
                className="group flex items-center gap-1.5 px-3 py-2 text-muted hover:text-white text-sm transition-all duration-200 rounded-lg hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span>Back</span>
              </Link>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium overflow-hidden transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
                  boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4), 0 0 0 1px rgba(124, 58, 237, 0.2)",
                }}
              >
                <span 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)",
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Add Job
                </span>
              </motion.button>
              <button
                onClick={fetchJobs}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
              >
                Refresh
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
            className="grid grid-cols-1 gap-4 mb-8"
          >
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-muted text-sm">Total Jobs</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </motion.div>

          {/* Create Job Modal */}
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto accent-glow"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">
                    Create Job Posting
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-muted hover:text-white transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateJob} className="space-y-4">
                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-400 text-sm">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="job_posting_url"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Job Posting URL (required)
                    </label>
                    <input
                      id="job_posting_url"
                      type="url"
                      value={formData.job_posting_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          job_posting_url: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Company Name (optional)
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="position"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Position Title (optional)
                    </label>
                    <input
                      id="position"
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="experience_level"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Experience Level (optional)
                    </label>
                    <select
                      id="experience_level"
                      value={formData.experience_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experience_level: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    >
                      <option value="">Select experience level</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="Lead/Manager">Lead/Manager</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Career Fields (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CAREER_FIELD_OPTIONS.map((field) => (
                        <button
                          key={field}
                          type="button"
                          onClick={() => toggleCareerField(field)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            formData.career_fields.includes(field)
                              ? "bg-electric text-white"
                              : "bg-white/10 text-muted hover:bg-white/20 hover:text-white"
                          }`}
                        >
                           {CAREER_FIELD_LABELS[field]}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="flex items-center gap-2">
                     <input
                       type="checkbox"
                       id="referral_available"
                       checked={formData.referral_available}
                       onChange={(e) =>
                         setFormData({ ...formData, referral_available: e.target.checked })
                       }
                       className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-electric focus:border-electric"
                     />
                     <label
                       htmlFor="referral_available"
                       className="text-sm font-medium text-white cursor-pointer"
                     >
                       Referral Available
                     </label>
                   </div>

                   <div>
                     <label
                       htmlFor="notes"
                       className="block text-sm font-medium text-white mb-1"
                     >
                       Notes (optional)
                     </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      placeholder="Additional notes (e.g., Referral available, deadline)"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage:
                          "linear-gradient(117.96deg, #6f58da, #5131e7)",
                        boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                      }}
                    >
                      {formLoading ? "Creating..." : "Create Job Posting"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                        setFormError(null);
                      }}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Edit Job Modal */}
          {editingJob && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => {
              setEditingJob(null);
              resetForm();
              setFormError(null);
            }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-black/90 backdrop-blur-md border border-electric/30 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto accent-glow"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">
                    Edit Job Posting
                  </h2>
                  <button
                    onClick={() => {
              setEditingJob(null);
              resetForm();
              setFormError(null);
            }}
                    className="text-muted hover:text-white transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdateJob} className="space-y-4">
                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-400 text-sm">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="edit_job_posting_url"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Job Posting URL (required)
                    </label>
                    <input
                      id="edit_job_posting_url"
                      type="url"
                      value={formData.job_posting_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          job_posting_url: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit_company"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Company Name (optional)
                    </label>
                    <input
                      id="edit_company"
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit_position"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Position Title (optional)
                    </label>
                    <input
                      id="edit_position"
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit_experience_level"
                      className="block text-sm font-medium text-white mb-1"
                    >
                      Experience Level (optional)
                    </label>
                    <select
                      id="edit_experience_level"
                      value={formData.experience_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experience_level: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    >
                      <option value="">Select experience level</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="Lead/Manager">Lead/Manager</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Career Fields (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CAREER_FIELD_OPTIONS.map((field) => (
                        <button
                          key={field}
                          type="button"
                          onClick={() => toggleCareerField(field)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            formData.career_fields.includes(field)
                              ? "bg-electric text-white"
                              : "bg-white/10 text-muted hover:bg-white/20 hover:text-white"
                          }`}
                        >
                           {CAREER_FIELD_LABELS[field]}
                         </button>
                       ))}
                     </div>
                   </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit_referral_available"
                        checked={formData.referral_available}
                        onChange={(e) => {
                          setFormData({ ...formData, referral_available: e.target.checked });
                        }}
                        className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-electric focus:border-electric"
                      />
                      <label
                        htmlFor="edit_referral_available"
                        className="text-sm font-medium text-white cursor-pointer"
                      >
                        Referral Available
                      </label>
                    </div>

                   <div>
                     <label
                       htmlFor="edit_notes"
                       className="block text-sm font-medium text-white mb-1"
                     >
                       Notes (optional)
                     </label>
                     <textarea
                       id="edit_notes"
                       value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      placeholder="Additional notes (e.g., Referral available, deadline)"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage:
                          "linear-gradient(117.96deg, #6f58da, #5131e7)",
                        boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                      }}
                    >
                      {formLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
              setEditingJob(null);
              resetForm();
              setFormError(null);
            }}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Jobs List */}
          {(() => {
            const filteredJobs = jobs.filter(job => {
              const company = (job.company || "").toLowerCase();
              const position = (job.position || "").toLowerCase();
              const query = searchQuery.toLowerCase();
              return company.includes(query) || position.includes(query);
            }).sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
            });

            if (jobs.length === 0) {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-12 accent-glow text-center"
                >
                  <p className="text-muted text-lg mb-2">No job postings yet</p>
                  <p className="text-sm text-muted">Create your first job posting to get started.</p>
                </motion.div>
              );
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 accent-glow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Current Job Postings ({filteredJobs.length})
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                      <input
                        type="text"
                        placeholder="Search company or position..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      {sortOrder === "newest" ? "Newest Posted Date" : "Oldest Posted Date"}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {filteredJobs.length === 0 ? (
                    <div className="text-center py-8 text-muted">
                      {searchQuery ? "No jobs found matching your search." : "No jobs found."}
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">
                              {job.position || "Untitled Position"}
                            </h3>
                            <p className="text-muted mb-2">{job.company || "Unknown Company"}</p>
                            <a
                              href={job.job_posting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-electric hover:opacity-80 text-sm transition-opacity"
                            >
                              View Job Posting →
                            </a>
                            {job.experience_level && (
                              <span className="ml-4 px-2 py-1 bg-white/10 rounded text-xs text-muted">
                                {job.experience_level}
                              </span>
                            )}
                            {job.referral_available && (
                              <span className="ml-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 font-medium">
                                Referral Available
                              </span>
                            )}
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
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => startEditJob(job)}
                              className="px-3 py-1 bg-electric/10 border border-electric/20 text-electric rounded hover:bg-electric/20 transition-colors text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {job.notes && (
                          <div className="mt-2 text-sm text-muted bg-white/5 rounded p-2">
                            <strong>Note:</strong> {job.notes}
                          </div>
                        )}
                        <div className="mt-3 text-xs text-muted">
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            );
          })()}
        </motion.div>
      </div>
    </div>
  );
}

"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/api/supabase";
import type { Session } from "@supabase/supabase-js";

export default function ManageJobsPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample job postings data - replace with actual data fetching
  const jobPostings = [
    {
      id: 1,
      title: "Blockchain Developer Intern",
      company: "CryptoStart Inc.",
      location: "Remote",
      type: "Internship",
      posted: "2024-12-20",
      deadline: "2025-01-15",
      status: "active",
      applicants: 12
    },
    {
      id: 2,
      title: "DeFi Product Manager",
      company: "DeFi Labs",
      location: "Hybrid",
      type: "Full Time",
      posted: "2024-12-18",
      deadline: "2025-01-30",
      status: "active",
      applicants: 8
    },
    {
      id: 3,
      title: "Smart Contract Security Engineer",
      company: "SecureChain",
      location: "On Site",
      type: "Full Time",
      posted: "2024-12-15",
      deadline: "2025-01-20",
      status: "draft",
      applicants: 0
    }
  ];

  const stats = {
    total: 24,
    active: 18,
    draft: 6,
    expired: 3
  };

  // Check for existing session on mount
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Authorization check for auth state changes
        if (event === 'SIGNED_IN' && session?.user && session.user.email !== "blockchn@uw.edu") {
          await supabase.auth.signOut();
          setError("Access denied. Unauthorized email address.");
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_OUT') {
          setEmail("");
          setPassword("");
          setError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      case "active": return "text-green-400";
      case "draft": return "text-yellow-400";
      case "expired": return "text-red-400";
      default: return "text-muted";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "active": return "bg-green-400/10 border-green-400/20";
      case "draft": return "bg-yellow-400/10 border-yellow-400/20";
      case "expired": return "bg-red-400/10 border-red-400/20";
      default: return "bg-white/5 border-white/10";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Internship": return "text-blue-400";
      case "Full Time": return "text-green-400";
      case "Contract": return "text-purple-400";
      default: return "text-muted";
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
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
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
                    <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
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
                      backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
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
                Create, edit, and manage job postings for the UW Blockchain community.
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
                className="px-4 py-2 rounded-lg text-white text-sm transition-opacity hover:opacity-95"
                style={{
                  backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                  boxShadow: "0 4px 12px rgba(111, 88, 218, 0.35)",
                }}
              >
                Back to Admin
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {Object.entries(stats).map(([key, value]) => (
              <div
                key={key}
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 accent-glow"
              >
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-muted capitalize">{key}</div>
              </div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex gap-4">
              <button className="rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95"
                style={{
                  backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                  boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                }}>
                Create New Job Posting
              </button>
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
                Import Jobs
              </button>
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
                Export Jobs
              </button>
            </div>
          </motion.div>

          {/* Job Postings Table */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 accent-glow"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Job Postings</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors text-sm"
                />
                <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors text-sm">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Job Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Posted</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Deadline</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Applicants</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobPostings.map((job) => (
                    <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-white font-medium">{job.title}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white">{job.company}</td>
                      <td className="py-4 px-4 text-muted text-sm">{job.location}</td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-medium ${getTypeColor(job.type)}`}>
                          {job.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-muted text-sm">{job.posted}</td>
                      <td className="py-4 px-4 text-muted text-sm">{job.deadline}</td>
                      <td className="py-4 px-4 text-white">{job.applicants}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBg(job.status)} ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button className="text-electric hover:text-electric-alt text-sm transition-colors">
                            View
                          </button>
                          <button className="text-muted hover:text-white text-sm transition-colors">
                            Edit
                          </button>
                          <button className="text-red-400 hover:text-red-300 text-sm transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {jobPostings.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-white mb-4">No Job Postings Yet</h3>
                <p className="text-muted text-lg mb-8">
                  Create your first job posting to get started.
                </p>
                <button className="rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95"
                  style={{
                    backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                    boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                  }}>
                  Create First Job Posting
                </button>
              </div>
            )}

            {/* Pagination */}
            {jobPostings.length > 0 && (
              <div className="flex justify-center mt-6 gap-2">
                <button className="px-3 py-1 bg-white/5 border border-white/10 rounded text-white hover:bg-white/10 transition-colors text-sm">
                  Previous
                </button>
                <button className="px-3 py-1 bg-electric text-white rounded text-sm">
                  1
                </button>
                <button className="px-3 py-1 bg-white/5 border border-white/10 rounded text-white hover:bg-white/10 transition-colors text-sm">
                  2
                </button>
                <button className="px-3 py-1 bg-white/5 border border-white/10 rounded text-white hover:bg-white/10 transition-colors text-sm">
                  Next
                </button>
              </div>
            )}
          </motion.div>

          {/* Quick Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 mt-8"
          >
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 accent-glow">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">New job posted</span>
                  <span className="text-muted">2h ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Job updated</span>
                  <span className="text-muted">5h ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Application received</span>
                  <span className="text-muted">1d ago</span>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 accent-glow">
              <h3 className="text-lg font-semibold text-white mb-4">Top Companies</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white">CryptoStart Inc.</span>
                  <span className="text-muted">3 postings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">DeFi Labs</span>
                  <span className="text-muted">2 postings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">SecureChain</span>
                  <span className="text-muted">1 posting</span>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 accent-glow">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
                  Review All Applications
                </button>
                <button className="w-full text-left px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
                  Send Email Digest
                </button>
                <button className="w-full text-left px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
                  Generate Analytics Report
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
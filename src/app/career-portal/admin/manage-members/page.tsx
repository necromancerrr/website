"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/api/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

export default function ManageMembersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Check for existing session and authorization
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Authorization check
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
        // Authorization check
        if (event === 'SIGNED_IN' && session?.user && session.user.email !== "blockchn@uw.edu") {
          await supabase.auth.signOut();
          setError("Access denied. Unauthorized email address.");
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_OUT') {
          setError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch members when authenticated
  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    try {
      const { data: MemberInformation, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching members:', error);
        setError('Failed to fetch members');
      } else {
        setMembers(MemberInformation || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if email already exists in members table
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('email', memberEmail)
        .single();

      if (existingMember) {
        setError('A member with this email already exists');
        setLoading(false);
        return;
      }

      // Create user in auth system via API
      const authResponse = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: memberEmail,
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        setError(authData.error || 'Failed to create user in auth system');
        setLoading(false);
        return;
      }

      // Add new member to database (keep existing logic)
      const { data, error } = await supabase
        .from('members')
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            email: memberEmail,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else {
        setSuccess(`Successfully added ${firstName} ${lastName} to the career portal. A password reset email has been sent to ${memberEmail}.`);
        // Reset form
        setFirstName("");
        setLastName("");
        setMemberEmail("");
        setShowAddForm(false);
        // Refresh members list
        fetchMembers();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the career portal?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(`Successfully removed ${memberName} from the career portal`);
        fetchMembers();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_active: !isActive })
        .eq('id', memberId);

      if (error) {
        setError(error.message);
      } else {
        fetchMembers();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
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
                  Member Management
                  <span className="block text-electric">Admin Sign In</span>
                </h1>
                <p className="text-muted text-lg">
                  Access the career portal member management dashboard.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow"
              >
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('email') as string;
                  const password = formData.get('password') as string;
                  
                  supabase.auth.signInWithPassword({ email, password })
                    .then(({ data, error }) => {
                      if (error) {
                        setError(error.message);
                      } else if (data.user && data.user.email !== "blockchn@uw.edu") {
                        supabase.auth.signOut();
                        setError("Access denied. Unauthorized email address.");
                      }
                    });
                }} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                      Admin Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
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
                      name="password"
                      type="password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95"
                    style={{
                      backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                      boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                    }}
                  >
                    Access Member Management
                  </button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show member management dashboard
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
                Career Portal
                <span className="block text-electric">Member Management</span>
              </h1>
              <p className="text-muted text-lg">
                Manage who has access to the career portal.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 rounded-lg text-white text-sm transition-opacity hover:opacity-95"
                style={{
                  backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                  boxShadow: "0 4px 12px rgba(111, 88, 218, 0.35)",
                }}
              >
                {showAddForm ? "Cancel" : "Add Member"}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm mb-4">
              {success}
            </div>
          )}

          {/* Add Member Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 accent-glow mb-8"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Add New Member</h2>
              <form onSubmit={handleAddMember} className="grid md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="memberEmail" className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <input
                    id="memberEmail"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="john.doe@uw.edu"
                    required
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFirstName("");
                      setLastName("");
                      setMemberEmail("");
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 rounded-lg text-white text-sm transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                      boxShadow: "0 4px 12px rgba(111, 88, 218, 0.35)",
                    }}
                  >
                    {loading ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Members Table */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 accent-glow"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Members ({members.length})
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={fetchMembers}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
                >
                  Refresh
                </button>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Date Added</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="text-white font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white">{member.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            member.is_active 
                              ? "bg-green-400/10 border-green-400/20 text-green-400"
                              : "bg-yellow-400/10 border-yellow-400/20 text-yellow-400"
                          }`}>
                            {member.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted text-sm">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleActive(member.id, member.is_active)}
                              className={`text-sm transition-colors ${
                                member.is_active 
                                  ? "text-yellow-400 hover:text-yellow-300" 
                                  : "text-green-400 hover:text-green-300"
                              }`}
                            >
                              {member.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleRemoveMember(
                                member.id, 
                                `${member.first_name} ${member.last_name}`
                              )}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User, Session } from "@supabase/supabase-js";
import { Plus, X, ArrowLeft, Search } from "lucide-react";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  wallet_address?: string;
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
  const [walletAddress, setWalletAddress] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit form states
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWalletAddress, setEditWalletAddress] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Check for existing session and authorization
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      // Authorization check
      if (session?.user && session.user.email !== "blockchn@uw.edu") {
        await supabaseBrowser.auth.signOut();
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
    } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      // Authorization check
      if (
        event === "SIGNED_IN" &&
        session?.user &&
        session.user.email !== "blockchn@uw.edu"
      ) {
        await supabaseBrowser.auth.signOut();
        setError("Access denied. Unauthorized email address.");
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") {
        setError(null);
      }
    });

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
      const response = await fetch("/api/members");
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching members:", result.error);
        setError("Failed to fetch members");
      } else {
        setMembers(result.data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create user in auth system via API
      const inviteResponse = await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: memberEmail,
        }),
      });
      if (!inviteResponse.ok) {
        const inviteResult = await inviteResponse.json();
        setError(inviteResult.error || "Failed to send invite");
        setLoading(false);
        return;
      }
      // Add new member to database via API
      const memberResponse = await fetch("/api/members/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: memberEmail,
          wallet_address: walletAddress || null,
        }),
      });

      const memberResult = await memberResponse.json();

      if (!memberResponse.ok) {
        setError(memberResult.error || "Failed to add member");
      } else {
        setSuccess(
          `Successfully added ${firstName} ${lastName} to the career portal. A password reset email has been sent to ${memberEmail}.`,
        );
        // Reset form
        setFirstName("");
        setLastName("");
        setMemberEmail("");
        setWalletAddress("");
        setShowAddForm(false);
        // Refresh members list
        fetchMembers();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from the career portal?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Failed to remove member");
      } else {
        setSuccess(`Successfully removed ${memberName} from the career portal`);
        fetchMembers();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/members/${memberId}/toggle-active`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Failed to update member status");
      } else {
        fetchMembers();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const startEditMember = (member: Member) => {
    setEditingMember(member);
    setEditFirstName(member.first_name);
    setEditLastName(member.last_name);
    setEditEmail(member.email);
    setEditWalletAddress(member.wallet_address || "");
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/members/${editingMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail,
          wallet_address: editWalletAddress || null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Failed to update member");
      } else {
        setSuccess(`Successfully updated member information`);
        setEditingMember(null);
        fetchMembers();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setEditFirstName("");
    setEditLastName("");
    setEditEmail("");
    setEditWalletAddress("");
  };

  const handleSignOut = async () => {
    try {
      await supabaseBrowser.auth.signOut();
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const email = formData.get("email") as string;
                    const password = formData.get("password") as string;

                    supabaseBrowser.auth
                      .signInWithPassword({ email, password })
                      .then(({ data, error }) => {
                        if (error) {
                          setError(error.message);
                        } else if (
                          data.user &&
                          data.user.email !== "blockchn@uw.edu"
                        ) {
                          supabaseBrowser.auth.signOut();
                          setError(
                            "Access denied. Unauthorized email address.",
                          );
                        }
                      });
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-white mb-2"
                    >
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
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-white mb-2"
                    >
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
                      backgroundImage:
                        "linear-gradient(117.96deg, #6f58da, #5131e7)",
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
              <Link
                href="/career-portal/admin"
                className="group flex items-center gap-1.5 px-3 py-2 text-muted hover:text-white text-sm transition-all duration-200 rounded-lg hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span>Back</span>
              </Link>
              <motion.button
                onClick={() => setShowAddForm(!showAddForm)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium overflow-hidden transition-all duration-300"
                style={{
                  background: showAddForm
                    ? "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))"
                    : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
                  boxShadow: showAddForm
                    ? "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
                    : "0 4px 20px rgba(124, 58, 237, 0.4), 0 0 0 1px rgba(124, 58, 237, 0.2)",
                }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)",
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {showAddForm ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                      Add Member
                    </>
                  )}
                </span>
              </motion.button>
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
              <h2 className="text-xl font-semibold text-white mb-4">
                Add New Member
              </h2>
              <form
                onSubmit={handleAddMember}
                className="grid md:grid-cols-3 gap-4"
              >
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-white mb-2"
                  >
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
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-white mb-2"
                  >
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
                  <label
                    htmlFor="memberEmail"
                    className="block text-sm font-medium text-white mb-2"
                  >
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
                <div>
                  <label
                    htmlFor="walletAddress"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Wallet Address (Optional)
                  </label>
                  <input
                    id="walletAddress"
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="0x..."
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
                      setWalletAddress("");
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
                      backgroundImage:
                        "linear-gradient(117.96deg, #6f58da, #5131e7)",
                      boxShadow: "0 4px 12px rgba(111, 88, 218, 0.35)",
                    }}
                  >
                    {loading ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Edit Member Form */}
          {editingMember && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-black/40 backdrop-blur-sm border border-electric/30 rounded-2xl p-6 accent-glow mb-8"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Edit Member
              </h2>
              <form
                onSubmit={handleUpdateMember}
                className="grid md:grid-cols-3 gap-4"
              >
                <div>
                  <label
                    htmlFor="editFirstName"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    First Name
                  </label>
                  <input
                    id="editFirstName"
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="editLastName"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    id="editLastName"
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="Doe"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="editEmail"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="editEmail"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="john.doe@uw.edu"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="editWalletAddress"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Wallet Address (Optional)
                  </label>
                  <input
                    id="editWalletAddress"
                    type="text"
                    value={editWalletAddress}
                    onChange={(e) => setEditWalletAddress(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                    placeholder="0x..."
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 rounded-lg text-white text-sm transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage:
                        "linear-gradient(117.96deg, #6f58da, #5131e7)",
                      boxShadow: "0 4px 12px rgba(111, 88, 218, 0.35)",
                    }}
                  >
                    {loading ? "Saving..." : "Save Changes"}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-white">
                Members ({members.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Wallet Address
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Date Added
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.filter((member) => {
                    const fullName =
                      `${member.first_name} ${member.last_name}`.toLowerCase();
                    return fullName.includes(searchQuery.toLowerCase());
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted">
                        {searchQuery
                          ? "No members found matching your search."
                          : "No members found."}
                      </td>
                    </tr>
                  ) : (
                    members
                      .filter((member) => {
                        const fullName =
                          `${member.first_name} ${member.last_name}`.toLowerCase();
                        return fullName.includes(searchQuery.toLowerCase());
                      })
                      .map((member) => (
                        <tr
                          key={member.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="text-white font-medium">
                              {member.first_name} {member.last_name}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-white">
                            {member.email}
                          </td>
                          <td className="py-4 px-4 text-muted text-sm">
                            {member.wallet_address ? (
                              <span
                                className="font-mono text-xs"
                                title={member.wallet_address}
                              >
                                {member.wallet_address.slice(0, 6)}...
                                {member.wallet_address.slice(-4)}
                              </span>
                            ) : (
                              <span className="text-white/40">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${member.is_active
                                  ? "bg-green-400/10 border-green-400/20 text-green-400"
                                  : "bg-yellow-400/10 border-yellow-400/20 text-yellow-400"
                                }`}
                            >
                              {member.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-muted text-sm">
                            {new Date(member.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditMember(member)}
                                className="text-electric hover:text-electric/80 text-sm transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleActive(
                                    member.id,
                                    member.is_active,
                                  )
                                }
                                className={`text-sm transition-colors ${member.is_active
                                    ? "text-yellow-400 hover:text-yellow-300"
                                    : "text-green-400 hover:text-green-300"
                                  }`}
                              >
                                {member.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveMember(
                                    member.id,
                                    `${member.first_name} ${member.last_name}`,
                                  )
                                }
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

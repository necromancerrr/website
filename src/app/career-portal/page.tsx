"use client";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";
import { usePrivy } from "@privy-io/react-auth";
import { useTheme } from "@/components/ThemeContext";

export default function CareerPortalPage() {
  const router = useRouter();
  const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout } = usePrivy();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState<string | null>(null);
  const [memberFirstName, setMemberFirstName] = useState<string | null>(null);



  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    graduationDate: "",
    academicProgram: "",
    linkedinUrl: "",
    githubUrl: "",
    jobSearchStatus: "open",
    notes: "",
  });

  // Career interests state
  const [careerInterests, setCareerInterests] = useState({
    engineering: {
      softwareEngineering: false,
      blockchainDevelopment: false,
      devOpsEngineering: false,
    },
    finance: false,
    productManagement: false,
    dataScience: false,
    uiUxDesign: false,
    businessDevelopment: false,
    researchAcademia: false,
    marketing: false,
    legal: false,
    security: false,
    venture: false,
  });


  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load existing profile data
  const loadProfile = async (userEmail: string) => {
    let profileData = null;

    try {
      const response = await fetch(`/api/profile?email=${encodeURIComponent(userEmail)}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading profile:', result.error);
      } else {
        profileData = result.data;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }

    if (profileData) {
      setProfile({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        graduationDate: profileData.expected_graduation ? `${profileData.expected_graduation}-01` : "",
        academicProgram: profileData.degree || "",
        linkedinUrl: profileData.social_linkedin || "",
        githubUrl: profileData.social_github || "",
        jobSearchStatus: "open",
        notes: profileData.notes || "",
      });

      if (profileData.career_interests && Array.isArray(profileData.career_interests)) {
        const interests = profileData.career_interests as string[];
        const updatedInterests = { ...careerInterests };

        Object.keys(updatedInterests).forEach(key => {
          if (key === 'engineering') {
            Object.keys(updatedInterests.engineering).forEach(engKey => {
              updatedInterests.engineering[engKey as keyof typeof updatedInterests.engineering] = false;
            });
          } else {
            updatedInterests[key as keyof Omit<typeof updatedInterests, 'engineering'>] = false;
          }
        });

        interests.forEach(interest => {
          const interestKey = interest.toLowerCase().replace(/\s+/g, '');

          if (interestKey.includes('software') || interestKey.includes('engineering')) {
            updatedInterests.engineering.softwareEngineering = true;
          } else if (interestKey.includes('blockchain') || interestKey.includes('dev')) {
            updatedInterests.engineering.blockchainDevelopment = true;
          } else if (interestKey.includes('devops')) {
            updatedInterests.engineering.devOpsEngineering = true;
          } else if (interestKey.includes('finance')) {
            updatedInterests.finance = true;
          } else if (interestKey.includes('product') || interestKey.includes('management')) {
            updatedInterests.productManagement = true;
          } else if (interestKey.includes('data') || interestKey.includes('science')) {
            updatedInterests.dataScience = true;
          } else if (interestKey.includes('design') || interestKey.includes('ux')) {
            updatedInterests.uiUxDesign = true;
          } else if (interestKey.includes('business') || interestKey.includes('development')) {
            updatedInterests.businessDevelopment = true;
          } else if (interestKey.includes('research') || interestKey.includes('academia')) {
            updatedInterests.researchAcademia = true;
          } else if (interestKey.includes('marketing')) {
            updatedInterests.marketing = true;
          } else if (interestKey.includes('legal')) {
            updatedInterests.legal = true;
          } else if (interestKey.includes('security')) {
            updatedInterests.security = true;
          } else if (interestKey.includes('venture')) {
            updatedInterests.venture = true;
          }
        });

        setCareerInterests(updatedInterests);
      }
    }

    // Fetch first_name from members table for welcome message
    try {
      const { data: member } = await supabase
        .from('members')
        .select('first_name')
        .eq('email', userEmail)
        .maybeSingle();

      if (member?.first_name) {
        setMemberFirstName(member.first_name);
      }
    } catch (memberErr) {
      console.error('Error fetching member first name:', memberErr);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user.email) {
        await loadProfile(session.user.email);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT") {
        setEmail("");
        setPassword("");
        setError(null);
        setMemberEmail(null);
        setMemberFirstName(null);
        // Reset profile data
        setProfile({
          firstName: "",
          lastName: "",
          graduationDate: "",
          academicProgram: "",
          linkedinUrl: "",
          githubUrl: "",
          jobSearchStatus: "open",
          notes: "",
        });
        setCareerInterests({
          engineering: {
            softwareEngineering: false,
            blockchainDevelopment: false,
            devOpsEngineering: false,
          },
          finance: false,
          productManagement: false,
          dataScience: false,
          uiUxDesign: false,
          businessDevelopment: false,
          researchAcademia: false,
          marketing: false,
          legal: false,
          security: false,
          venture: false,
        });
      } else if (event === "SIGNED_IN") {
        setError(null);
        if (session?.user.email) {
          await loadProfile(session.user.email);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load profile data when user changes (Supabase)
  useEffect(() => {
    if (user?.email) {
      loadProfile(user.email);
    }
  }, [user?.email]);

  // Load profile data when Privy user authenticates
  useEffect(() => {
    if (ready && authenticated && privyUser) {
      const checkWalletAuthorization = async () => {
        const walletAddress = privyUser.wallet?.address?.toLowerCase();
        if (walletAddress) {
          console.log('Checking wallet authorization for:', walletAddress);

          try {
            const response = await fetch('/api/auth/check-wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress }),
            });

            const result = await response.json();
            console.log('Authorization result:', result);

            if (!result.authorized) {
              setError(result.error || "You are not authorized");
              await privyLogout();
            } else {
              // Store the member's email and first name for profile operations
              if (result.member?.email) {
                setMemberEmail(result.member.email);
                setMemberFirstName(result.member.first_name || null);
                console.log('Loading profile for member email:', result.member.email);
                await loadProfile(result.member.email);
              }
            }
          } catch (err) {
            console.error('Authorization check error:', err);
            setError("You are not authorized");
            await privyLogout();
          }
        }
      };

      checkWalletAuthorization();
    }
  }, [ready, authenticated, privyUser]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Successful sign in
        setUser(data.user);
        setSession(data.session);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Sign out from both Supabase and Privy
      await supabase.auth.signOut();
      if (authenticated) {
        await privyLogout();
      }
      // Clear member email and first name
      setMemberEmail(null);
      setMemberFirstName(null);
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  };

  // Get user identifier (email from Supabase or wallet address from Privy)
  const getUserIdentifier = () => {
    // For wallet sign-in, use the member's email from database
    if (memberEmail) return memberEmail;
    if (user?.email) return user.email;
    if (privyUser?.wallet?.address) return privyUser.wallet.address;
    if (privyUser?.email?.address) return privyUser.email.address;
    return null;
  };

  // Check if user is authenticated via either method
  const isAuthenticated = user || (ready && authenticated);

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
            className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]"
          >
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="font-heading text-4xl sm:text-5xl leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
                  Career Portal
                  <span className="block text-electric">Sign In</span>
                </h1>
                <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
                  Access exclusive opportunities and connect with industry
                  partners.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="backdrop-blur-sm rounded-2xl p-8 accent-glow"
                style={{
                  backgroundColor: "var(--surface)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--border)",
                }}
              >
                <form onSubmit={handleSignIn} className="space-y-6">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                      placeholder="your.email@uw.edu"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded focus:ring-electric focus:border-electric" style={{ backgroundColor: "var(--surface)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)" }}
                      />
                      <span className="ml-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => router.push("/reset-password")}
                      className="text-sm text-electric hover:text-electric-alt transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95 disabled:opacity-50"
                    style={{
                      backgroundImage:
                        "linear-gradient(117.96deg, #6f58da, #5131e7)",
                      boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                    }}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-6">
                  <div className="flex-1" style={{ borderTopWidth: "1px", borderTopStyle: "solid", borderColor: "var(--border)" }}></div>
                  <span className="px-4 text-sm" style={{ color: "var(--text-secondary)" }}>or</span>
                  <div className="flex-1" style={{ borderTopWidth: "1px", borderTopStyle: "solid", borderColor: "var(--border)" }}></div>
                </div>

                {/* Wallet Connect Button */}
                <button
                  type="button"
                  onClick={() => privyLogin()}
                  disabled={!ready}
                  className="w-full rounded-full px-6 py-3 font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-3"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                  {ready ? "Connect Wallet" : "Loading..."}
                </button>

                <div className="mt-6 text-center">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Don't have an account?{" "}
                    <a
                      href="#"
                      className="text-electric hover:text-electric-alt transition-colors"
                    >
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Prepare career interests data for JSON field
      const selectedInterests: string[] = [];

      // Check engineering interests
      Object.entries(careerInterests.engineering).forEach(([key, value]) => {
        if (value) {
          selectedInterests.push(key.replace(/([A-Z])/g, ' $1').trim());
        }
      });

      // Check other interests
      Object.entries(careerInterests).forEach(([key, value]) => {
        if (key !== 'engineering' && value) {
          selectedInterests.push(key.replace(/([A-Z])/g, ' $1').trim());
        }
      });

      const profileData = {
        email: getUserIdentifier(), // Use wallet address or email from Privy/Supabase
        expected_graduation: profile.graduationDate ? new Date(profile.graduationDate).getFullYear() : null,
        degree: profile.academicProgram,
        career_interests: selectedInterests,
        social_linkedin: profile.linkedinUrl,
        social_github: profile.githubUrl,
        notes: profile.notes,
      };

      // Call API endpoint
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile');
      }

      setSaveMessage("Profile saved successfully!");
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage("Error saving profile. Please try again.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };



  const renderProfileTab = () => (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Personal Information</h3>
        <label className="block text-sm mb-4" style={{ color: "var(--text-primary)" }}>
          Filling this is optional. We will use these data to understand our club demography better.
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Email
            </label>
            <input
              type="email"
              value={session?.user.email || ""}
              disabled
              className="w-full px-4 py-3 rounded-lg cursor-not-allowed"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Expected Graduation
            </label>
            <input
              type="month"
              value={profile.graduationDate}
              onChange={(e) => setProfile({ ...profile, graduationDate: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Degree
            </label>
            <input
              type="text"
              value={profile.academicProgram}
              onChange={(e) => setProfile({ ...profile, academicProgram: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="e.g., Computer Science, Business Administration"
            />
          </div>
        </div>
      </div>

      {/* Career Interests */}
      <div>
        <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Career Interests</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Engineering</h4>
            <div className="space-y-2">
              {Object.entries(careerInterests.engineering).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setCareerInterests({
                        ...careerInterests,
                        engineering: {
                          ...careerInterests.engineering,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded focus:ring-electric focus:border-electric" style={{ backgroundColor: "var(--surface)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)" }}
                  />
                  <span className="ml-2 text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Other Interests</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(careerInterests).filter(([key]) => key !== 'engineering').map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={typeof value === 'boolean' ? value : false}
                    onChange={(e) =>
                      setCareerInterests({
                        ...careerInterests,
                        [key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded focus:ring-electric focus:border-electric" style={{ backgroundColor: "var(--surface)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)" }}
                  />
                  <span className="ml-2 text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Additional Information */}
      <div>
        <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Additional Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              LinkedIn Profile URL (Optional)
            </label>
            <input
              type="url"
              value={profile.linkedinUrl}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              GitHub/Portfolio URL (Optional)
            </label>
            <input
              type="url"
              value={profile.githubUrl}
              onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="https://github.com/yourusername"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Notes (Optional)
            </label>
            <textarea
              value={profile.notes}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors resize-none"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="Any additional information about your career preferences..."
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end items-center">
        <div className="flex items-center space-x-4">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95 disabled:opacity-50"
            style={{
              backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
              boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
            }}
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );



  // Render job portal dashboard
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
          <div className="flex justify-between items-start mb-8">
            <div className="text-center">
              <h1 className="font-heading text-4xl sm:text-5xl leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
                Career Portal
                <span className="block text-electric">Profile</span>
              </h1>
              <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
                Welcome back, {memberFirstName || session?.user.email?.split('@')[0] ||
                  (privyUser?.wallet?.address ? `${privyUser.wallet.address.slice(0, 6)}...${privyUser.wallet.address.slice(-4)}` :
                    privyUser?.email?.address?.split('@')[0] || 'User')}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm backdrop-blur-sm rounded-lg transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              Sign Out
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div
              className="flex space-x-1 backdrop-blur-sm rounded-xl p-1"
              style={{
                backgroundColor: "var(--surface)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
              }}
            >
              <button
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-electric shadow-lg"
                style={{ color: theme === "light" ? "#000000" : "#FFFFFF" }}
              >
                Profile
              </button>
              <button
                onClick={() => router.push("/career-portal/jobs")}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-electric hover:text-white"
                style={{ color: "var(--text-secondary)" }}
              >
                Job Postings
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="backdrop-blur-sm rounded-2xl p-8 accent-glow"
            style={{
              backgroundColor: "var(--surface)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border)",
            }}
          >
            {renderProfileTab()}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

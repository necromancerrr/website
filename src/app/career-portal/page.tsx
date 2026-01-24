"use client";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";
import { usePrivy } from "@privy-io/react-auth";

export default function CareerPortalPage() {
  const router = useRouter();
  const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout } = usePrivy();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



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
    try {
      const response = await fetch(`/api/profile?email=${encodeURIComponent(userEmail)}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading profile:', result.error);
        return;
      }

      const profileData = result.data;

      if (profileData) {
        // Load basic profile data
        setProfile({
          firstName: "",
          lastName: "",
          graduationDate: profileData.expected_graduation ? `${profileData.expected_graduation}-01` : "",
          academicProgram: profileData.degree || "",
          linkedinUrl: profileData.social_linkedin || "",
          githubUrl: profileData.social_github || "",
          jobSearchStatus: "open",
          notes: profileData.notes || "",
        });

        // Load career interests
        if (profileData.career_interests && Array.isArray(profileData.career_interests)) {
          const interests = profileData.career_interests as string[];
          const updatedInterests = { ...careerInterests };

          // Reset all interests first
          Object.keys(updatedInterests).forEach(key => {
            if (key === 'engineering') {
              Object.keys(updatedInterests.engineering).forEach(engKey => {
                updatedInterests.engineering[engKey as keyof typeof updatedInterests.engineering] = false;
              });
            } else {
              updatedInterests[key as keyof Omit<typeof updatedInterests, 'engineering'>] = false;
            }
          });

          // Set selected interests
          interests.forEach(interest => {
            const interestKey = interest.toLowerCase().replace(/\s+/g, '');

            // Check engineering interests
            if (interestKey.includes('software') || interestKey.includes('engineering')) {
              updatedInterests.engineering.softwareEngineering = true;
            } else if (interestKey.includes('blockchain') || interestKey.includes('dev')) {
              updatedInterests.engineering.blockchainDevelopment = true;
            } else if (interestKey.includes('devops')) {
              updatedInterests.engineering.devOpsEngineering = true;
            }
            // Check other interests
            else if (interestKey.includes('finance')) {
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
    } catch (error) {
      console.error('Error loading profile:', error);
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
      // Get identifier from Privy user (wallet address or email)
      const identifier = privyUser.wallet?.address || privyUser.email?.address;
      if (identifier) {
        loadProfile(identifier);
      }
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
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  };

  // Get user identifier (email from Supabase or wallet address from Privy)
  const getUserIdentifier = () => {
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
                <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-4">
                  Career Portal
                  <span className="block text-electric">Sign In</span>
                </h1>
                <p className="text-muted text-lg">
                  Access exclusive opportunities and connect with industry
                  partners.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow"
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
                      className="block text-sm font-medium text-white mb-2"
                    >
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
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-white mb-2"
                    >
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
                      <span className="ml-2 text-sm text-muted">
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
                  <div className="flex-1 border-t border-white/10"></div>
                  <span className="px-4 text-muted text-sm">or</span>
                  <div className="flex-1 border-t border-white/10"></div>
                </div>

                {/* Wallet Connect Button */}
                <button
                  type="button"
                  onClick={() => privyLogin()}
                  disabled={!ready}
                  className="w-full rounded-full text-white px-6 py-3 font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 bg-white/10 border border-white/20 hover:bg-white/15 flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                  {ready ? "Connect Wallet" : "Loading..."}
                </button>

                <div className="mt-6 text-center">
                  <p className="text-muted text-sm">
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
        <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
        <label className="block text-sm text-white mb-4">
          Filling this is optional. We will use these data to understand our club demography better.
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={session?.user.email || ""}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-muted cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Expected Graduation
            </label>
            <input
              type="month"
              value={profile.graduationDate}
              onChange={(e) => setProfile({ ...profile, graduationDate: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">
              Degree
            </label>
            <input
              type="text"
              value={profile.academicProgram}
              onChange={(e) => setProfile({ ...profile, academicProgram: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              placeholder="e.g., Computer Science, Business Administration"
            />
          </div>
        </div>
      </div>

      {/* Career Interests */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Career Interests</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Engineering</h4>
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
                    className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-electric focus:border-electric"
                  />
                  <span className="ml-2 text-sm text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white mb-2">Other Interests</h4>
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
                    className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-electric focus:border-electric"
                  />
                  <span className="ml-2 text-sm text-white capitalize">
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
        <h3 className="text-xl font-semibold text-white mb-4">Additional Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              LinkedIn Profile URL (Optional)
            </label>
            <input
              type="url"
              value={profile.linkedinUrl}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              GitHub/Portfolio URL (Optional)
            </label>
            <input
              type="url"
              value={profile.githubUrl}
              onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              placeholder="https://github.com/yourusername"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={profile.notes}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors resize-none"
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
              <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-4">
                Career Portal
                <span className="block text-electric">Profile</span>
              </h1>
              <p className="text-muted text-lg">
                Welcome back, {session?.user.email?.split('@')[0] ||
                  (privyUser?.wallet?.address ? `${privyUser.wallet.address.slice(0, 6)}...${privyUser.wallet.address.slice(-4)}` :
                    privyUser?.email?.address?.split('@')[0] || 'User')}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-white bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1">
              <button
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-electric text-white shadow-lg"
              >
                Profile
              </button>
              <button
                onClick={() => router.push("/career-portal/jobs")}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all text-muted hover:bg-electric hover:text-white"
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
            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow"
          >
            {renderProfileTab()}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

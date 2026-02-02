"use client";
import type { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";
import { usePrivy } from "@privy-io/react-auth";
import { Briefcase, User, LogOut, ChevronRight, Wallet } from "lucide-react";

export default function CareerPortalPage() {
  const router = useRouter();
  const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout } = usePrivy();
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
      softwareengineering: false,
      blockchaindevelopment: false,
      devopsengineering: false,
    },
    finance: false,
    productmanagement: false,
    datascience: false,
    uiuxdesign: false,
    businessdevelopment: false,
    researchacademia: false,
    marketing: false,
    legal: false,
    security: false,
    venture: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "profile">("overview");

  // Helper function to format career interest keys for display
  const formatCareerInterest = (key: string): string => {
    // Add space before common words
    return key
      .replace(/engineering/g, ' engineering')
      .replace(/development/g, ' development')
      .replace(/management/g, ' management')
      .replace(/science/g, ' science')
      .replace(/design/g, ' design')
      .replace(/academia/g, ' academia')
      .replace(/business/g, 'business ')
      .replace(/research/g, 'research ')
      .replace(/product/g, 'product ')
      .replace(/data/g, 'data ')
      .replace(/software/g, 'software ')
      .replace(/blockchain/g, 'blockchain ')
      .replace(/devops/g, 'devops ')
      .replace(/uiux/g, 'UI/UX ')
      .trim();
  };

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
            updatedInterests.engineering.softwareengineering = true;
          } else if (interestKey.includes('blockchain') || interestKey.includes('dev')) {
            updatedInterests.engineering.blockchaindevelopment = true;
          } else if (interestKey.includes('devops')) {
            updatedInterests.engineering.devopsengineering = true;
          } else if (interestKey.includes('finance')) {
            updatedInterests.finance = true;
          } else if (interestKey.includes('product') || interestKey.includes('management')) {
            updatedInterests.productmanagement = true;
          } else if (interestKey.includes('data') || interestKey.includes('science')) {
            updatedInterests.datascience = true;
          } else if (interestKey.includes('design') || interestKey.includes('ux')) {
            updatedInterests.uiuxdesign = true;
          } else if (interestKey.includes('business') || interestKey.includes('development')) {
            updatedInterests.businessdevelopment = true;
          } else if (interestKey.includes('research') || interestKey.includes('academia')) {
            updatedInterests.researchacademia = true;
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
            softwareengineering: false,
            blockchaindevelopment: false,
            devopsengineering: false,
          },
          finance: false,
          productmanagement: false,
          datascience: false,
          uiuxdesign: false,
          businessdevelopment: false,
          researchacademia: false,
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

  // Get display name
  const displayName = memberFirstName || 
    session?.user.email?.split('@')[0] ||
    (privyUser?.wallet?.address ? `${privyUser.wallet.address.slice(0, 6)}...${privyUser.wallet.address.slice(-4)}` :
      privyUser?.email?.address?.split('@')[0] || 'User');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-medium text-white mb-2">
              Career Portal
            </h1>
            <p className="text-sm text-zinc-400">
              Sign in to access opportunities and manage your profile.
            </p>
          </div>

          {/* Sign In Form */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
            {error && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="your.email@uw.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-zinc-800"></div>
              <span className="px-3 text-xs text-zinc-600">or</span>
              <div className="flex-1 border-t border-zinc-800"></div>
            </div>

            {/* Wallet Connect */}
            <button
              type="button"
              onClick={() => privyLogin()}
              disabled={!ready}
              className="w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium rounded border border-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {ready ? "Connect wallet" : "Loading..."}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            Need access? Contact the UW Blockchain team.
          </p>
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
          selectedInterests.push(formatCareerInterest(key));
        }
      });

      // Check other interests
      Object.entries(careerInterests).forEach(([key, value]) => {
        if (key !== 'engineering' && value) {
          selectedInterests.push(formatCareerInterest(key));
        }
      });

      const profileData = {
        email: getUserIdentifier(),
        expected_graduation: profile.graduationDate ? new Date(profile.graduationDate).getFullYear() : null,
        degree: profile.academicProgram,
        career_interests: selectedInterests,
        social_linkedin: profile.linkedinUrl,
        social_github: profile.githubUrl,
        notes: profile.notes,
      };

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

      setSaveMessage("Profile saved successfully");
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage("Failed to save profile");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen pt-6 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-medium text-white">
                Career Portal
              </h1>
              <p className="text-sm text-zinc-500">
                Welcome back, {displayName}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1 p-1 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
                activeTab === "overview"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
                activeTab === "profile"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          </nav>
        </header>

        {/* Content */}
        {activeTab === "overview" ? (
          <div className="space-y-4">
            {/* Job Board Card */}
            <button
              onClick={() => router.push("/career-portal/jobs")}
              className="w-full text-left group"
            >
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-white mb-1">
                      Job Board
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Browse opportunities from our community and partners
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </div>
            </button>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Your profile</p>
                <p className="text-sm text-zinc-300">
                  {profile.academicProgram || "Not set"}
                </p>
              </div>
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Career interests</p>
                <p className="text-sm text-zinc-300">
                  {Object.values(careerInterests).flatMap(v => 
                    typeof v === 'object' ? Object.values(v) : v
                  ).filter(Boolean).length} selected
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Form */}
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
              <h2 className="text-sm font-medium text-white mb-4">Personal Information</h2>
              <p className="text-xs text-zinc-500 mb-4">
                This information helps us understand our community and match you with relevant opportunities.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={session?.user.email || memberEmail || ""}
                    disabled
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-zinc-500 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Expected Graduation</label>
                    <input
                      type="month"
                      value={profile.graduationDate}
                      onChange={(e) => setProfile({ ...profile, graduationDate: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Degree/Program</label>
                    <input
                      type="text"
                      value={profile.academicProgram}
                      onChange={(e) => setProfile({ ...profile, academicProgram: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Career Interests */}
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
              <h2 className="text-sm font-medium text-white mb-4">Career Interests</h2>
              
              <div className="flex flex-wrap gap-2">
                {/* Engineering interests */}
                {Object.entries(careerInterests.engineering).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setCareerInterests({
                      ...careerInterests,
                      engineering: {
                        ...careerInterests.engineering,
                        [key]: !value,
                      },
                    })}
                    className={`px-2.5 py-1 text-xs rounded transition-colors ${
                      value
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600"
                    }`}
                  >
                    {formatCareerInterest(key)}
                  </button>
                ))}
                
                {/* Other interests */}
                {Object.entries(careerInterests)
                  .filter(([key]) => key !== 'engineering')
                  .map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setCareerInterests({
                        ...careerInterests,
                        [key]: !value,
                      })}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        value
                          ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                          : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600"
                      }`}
                    >
                      {formatCareerInterest(key)}
                    </button>
                  ))}
              </div>
            </div>

            {/* Links & Notes */}
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
              <h2 className="text-sm font-medium text-white mb-4">Links & Notes</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">LinkedIn</label>
                    <input
                      type="url"
                      value={profile.linkedinUrl}
                      onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                      placeholder="linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">GitHub/Portfolio</label>
                    <input
                      type="url"
                      value={profile.githubUrl}
                      onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                      placeholder="github.com/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Notes</label>
                  <textarea
                    value={profile.notes}
                    onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                    placeholder="Additional information about your career interests..."
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4">
              {saveMessage && (
                <span className={`text-xs ${saveMessage.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {saveMessage}
                </span>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

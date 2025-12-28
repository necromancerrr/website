"use client";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";

export default function CareerPortalPage() {
  const router = useRouter();
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

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
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
      } else if (event === "SIGNED_IN") {
        setError(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  };

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
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage("Profile saved successfully!");
    } catch (error) {
      setSaveMessage("Error saving profile");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
    } else {
      alert("Please upload a PDF file");
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
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
              First Name
            </label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
              placeholder="Last name"
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
              Academic Program
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

      {/* Resume Upload */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Resume</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Upload Resume (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-electric file:text-white hover:file:bg-electric-alt transition-colors"
            />
            {resumeFile && (
              <p className="mt-2 text-sm text-muted">
                Selected: {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
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
              Job Search Status
            </label>
            <select
              value={profile.jobSearchStatus}
              onChange={(e) => setProfile({ ...profile, jobSearchStatus: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
            >
              <option value="actively-looking">Actively Looking</option>
              <option value="open">Open to Opportunities</option>
              <option value="not-looking">Not Looking</option>
            </select>
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
                Welcome back, {session?.user.email?.split('@')[0]}
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

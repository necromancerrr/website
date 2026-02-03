"use client";
import { useState, useEffect, Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";

function UpdatePasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Let Supabase handle the URL session detection automatically
    const checkSession = async () => {
      try {
        // Check if Supabase automatically detected and set the session from URL
        const { data: { session }, error } = await supabaseBrowser.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setError('Invalid or expired reset link. Please request a new password reset below.');
          return;
        }

        if (session?.user) {
          console.log('Found valid session from URL:', session.user);
          setEmail(session.user.email || "");
          setShowPasswordForm(true);
        } else {
          console.log('No session found, redirecting to reset password');
          setError('No valid session found. Please request a new password reset link.');
          setTimeout(() => {
            router.push('/reset-password');
          }, 3000);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An error occurred. Please try requesting a new password reset.');
        setTimeout(() => {
          router.push('/reset-password');
        }, 3000);
      }
    };

    checkSession();
  }, [searchParams, router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabaseBrowser.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password updated successfully! Redirecting to sign-in page...');
        
        // Redirect to sign-in page after 2 seconds
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 lg:pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 -top-24 h-64 bg-radial-fade" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="font-heading text-4xl sm:text-5xl text-white leading-tight mb-4">
                Update Password
                <span className="block text-electric">Career Portal Access</span>
              </h1>
              <p className="text-muted text-lg">
                {showPasswordForm 
                  ? `Create a new password for ${email}` 
                  : 'Validating reset link...'
                }
              </p>
            </div>

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

            {showPasswordForm && !success && (
              <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow">
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                      New Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      placeholder="Enter your new password"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      placeholder="Confirm your new password"
                      required
                      minLength={6}
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
                    {loading ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-muted text-sm">
                Need help? Contact{" "}
                <a href="mailto:blockchn@uw.edu" className="text-electric hover:underline">
                  blockchn@uw.edu
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-28 lg:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 -top-24 h-64 bg-radial-fade" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </div>
    }>
      <UpdatePasswordContent />
    </Suspense>
  );
}

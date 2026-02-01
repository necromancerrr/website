"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/api/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have access tokens in the URL (from password reset email)
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Set up the session using the tokens from the email
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (error) {
          setError('Invalid or expired reset link. Please request a new password reset below.');
          setShowEmailForm(true);
          setShowPasswordForm(false);
        } else if (data.user) {
          setEmail(data.user.email || "");
          setShowPasswordForm(true);
          setShowEmailForm(false);
        }
      });
    } else {
      // No tokens in URL, show email request form
      setShowEmailForm(true);
      setShowPasswordForm(false);
    }
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(`Password reset link sent to ${email}. Please check your email and click the link to set your password.`);
        // Clear email field after successful submission
        setEmail("");
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password updated successfully! Redirecting to career portal...');
        
        // Redirect to career portal after 2 seconds
        setTimeout(() => {
          router.push('/career-portal');
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
                {showPasswordForm ? 'Set Your Password' : 'Reset Password'}
                <span className="block text-electric">Career Portal Access</span>
              </h1>
              <p className="text-muted text-lg">
                {showPasswordForm 
                  ? `Create a password for ${email}` 
                  : 'Enter your email to receive a password reset link'
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

            {!success && (
              <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow">
                {showEmailForm ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                        Email Address
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

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full text-white px-6 py-3 font-semibold transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: "linear-gradient(117.96deg, #6f58da, #5131e7)",
                        boxShadow: "0 8px 24px rgba(111, 88, 218, 0.45)",
                      }}
                    >
                      {loading ? "Sending Reset Link..." : "Send Reset Link"}
                    </button>
                  </form>
                ) : (
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
                      {loading ? "Setting Password..." : "Set Password"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {showEmailForm && !success && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowEmailForm(false)}
                  className="text-electric hover:underline text-sm"
                >
                  Already have a reset link? Click here
                </button>
              </div>
            )}

            {showPasswordForm && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setShowEmailForm(true);
                    setShowPasswordForm(false);
                    setError(null);
                    setSuccess(null);
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-electric hover:underline text-sm"
                >
                  Need a new reset link? Request one here
                </button>
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

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}

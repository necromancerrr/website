"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/api/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastEmailSent, setLastEmailSent] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This page now only handles email requests for password reset
    // Password updates are handled by the update-password page
  }, [searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [countdown]);

  const handleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    // Use the stored email if resending, otherwise use the current email input
    const emailToSend = lastEmailSent || email;
    
    if (!emailToSend) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    // Validate email format (only if not resending)
    if (!lastEmailSent) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailToSend)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToSend, {
        redirectTo: `${window.location.origin}/change-password`
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(`Password reset link sent to ${emailToSend}. Please check your email and click the link to set your password.`);
        // Store the email that was sent to and clear the input field if not resending
        if (!lastEmailSent) {
          setLastEmailSent(emailToSend);
          setEmail("");
        }
        // Start countdown for resend
        setCountdown(10);
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
                Reset Password
                <span className="block text-electric">Career Portal Access</span>
              </h1>
              <p className="text-muted text-lg">
                Enter your email to receive a password reset link
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
                <div className="mt-3 pt-3 border-t border-green-500/20">
                  <p className="text-xs text-green-300 mb-2">Didn't receive the email?</p>
                  <button
                    onClick={handleEmailSubmit}
                    disabled={loading || countdown > 0}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading 
                      ? "Resending..." 
                      : countdown > 0 
                        ? `Resend Reset Link (${countdown}s)` 
                        : "Resend Reset Link"
                    }
                  </button>
                  {countdown > 0 && (
                    <p className="text-xs text-green-300 mt-2">
                      Please wait before requesting another reset link.
                    </p>
                  )}
                </div>
              </div>
            )}

            {!success && (
              <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow">
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

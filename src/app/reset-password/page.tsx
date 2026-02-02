"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/api/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";

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
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/career-portal")}
          className="group flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to career portal</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-white mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-zinc-400">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-zinc-300 mb-1">Check your email</p>
                  <p className="text-xs text-zinc-500">{success}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Didn't receive it?</span>
              <button
                onClick={handleEmailSubmit}
                disabled={loading || countdown > 0}
                className="text-xs text-violet-400 hover:text-violet-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading 
                  ? "Resending..." 
                  : countdown > 0 
                    ? `Resend (${countdown}s)` 
                    : "Resend link"
                }
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="your.email@uw.edu"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500">
            Need help? Contact{" "}
            <a href="mailto:blockchn@uw.edu" className="text-violet-400 hover:text-violet-300 transition-colors">
              blockchn@uw.edu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-20 text-zinc-500 text-sm">
            Loading...
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

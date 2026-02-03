"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase-admin";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";

function ChangePasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [validating, setValidating] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const validateResetSession = async () => {
      try {
        setValidating(true);
        
        // Check if Supabase automatically detected and set the session from URL parameters
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session validation error:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
          setIsValidSession(false);
          return;
        }

        if (session?.user) {
          console.log('Valid reset session detected for:', session.user.email);
          setEmail(session.user.email || "");
          setIsValidSession(true);
        } else {
          console.log('No valid reset session found');
          setError('This password reset link has expired or is invalid. Please request a new password reset.');
          setIsValidSession(false);
          
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            router.push('/reset-password');
          }, 3000);
        }
      } catch (err) {
        console.error('Unexpected error during session validation:', err);
        setError('An error occurred while validating your reset link. Please try again.');
        setIsValidSession(false);
      } finally {
        setValidating(false);
      }
    };

    validateResetSession();
  }, [searchParams, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!password || !confirmPassword) {
      setError('Please enter both password fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setError(`Session error: ${sessionError.message}`);
        setLoading(false);
        return;
      }
      
      if (!session) {
        setError('No active session found. Please use the password reset link from your email.');
        setLoading(false);
        return;
      }
      
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(`Error updating password: ${error.message}`);
      } else {
        setSuccess('Password changed successfully! You will be redirected to the career portal.');
        
        // Clear the form
        setPassword("");
        setConfirmPassword("");
        
        // Redirect to career portal after 2 seconds
        setTimeout(() => {
          router.push('/career-portal');
        }, 2000);
      }
    } catch (err) {
      setError(`An unexpected error occurred: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;

    const levels = [
      { strength: 0, label: 'Very Weak', color: 'bg-red-500' },
      { strength: 1, label: 'Weak', color: 'bg-red-400' },
      { strength: 2, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 3, label: 'Good', color: 'bg-blue-500' },
      { strength: 4, label: 'Strong', color: 'bg-green-500' },
      { strength: 5, label: 'Very Strong', color: 'bg-green-400' }
    ];

    return levels[Math.min(strength, 5)];
  };

  const passwordStrength = getPasswordStrength(password);

  if (validating) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500 mx-auto mb-3"></div>
            <p className="text-sm text-zinc-500">Validating your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        {!isValidSession && (
          <button
            onClick={() => router.push("/reset-password")}
            className="group flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to reset password</span>
          </button>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-white mb-2">
            Change Password
          </h1>
          <p className="text-sm text-zinc-400">
            {isValidSession 
              ? `Create a new password for ${email}` 
              : 'Validating reset link...'
            }
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-400 mb-1">Invalid Reset Link</p>
                <p className="text-xs text-zinc-500">{error}</p>
                <p className="text-xs text-zinc-600 mt-2">
                  You will be redirected automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-emerald-500 mb-1">Password Changed</p>
                <p className="text-xs text-zinc-500">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {isValidSession && !success && (
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                </div>
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-600">Strength:</span>
                      <span className={`text-xs ${
                        passwordStrength.color === 'bg-red-500' || passwordStrength.color === 'bg-red-400' ? 'text-red-400' :
                        passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-500' :
                        passwordStrength.color === 'bg-blue-500' ? 'text-blue-500' :
                        'text-emerald-500'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <p className="mt-2 text-xs text-zinc-600">
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && password.length > 0 && (
                  <p className="mt-1.5 text-xs text-emerald-500">Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                {loading ? "Changing..." : "Change password"}
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

export default function ChangePasswordPage() {
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
      <ChangePasswordContent />
    </Suspense>
  );
}

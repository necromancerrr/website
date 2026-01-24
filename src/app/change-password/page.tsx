"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/api/supabase";
import { useRouter, useSearchParams } from "next/navigation";

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
    console.log('=== PASSWORD CHANGE SUBMISSION STARTED ===');
    console.log('Password:', password ? '[FILLED]' : '[EMPTY]');
    console.log('Confirm Password:', confirmPassword ? '[FILLED]' : '[EMPTY]');
    console.log('Current loading state:', loading);
    console.log('Valid session state:', isValidSession);
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!password || !confirmPassword) {
      console.log('VALIDATION FAILED: Empty fields');
      setError('Please enter both password fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      console.log('VALIDATION FAILED: Passwords do not match');
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    console.log('VALIDATION PASSED - CALLING SUPABASE API...');
    
    try {
      console.log('Step 1: Getting current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Step 1 FAILED - Session error:', sessionError);
        setError(`Session error: ${sessionError.message}`);
        setLoading(false);
        return;
      }
      
      if (!session) {
        console.error('Step 1 FAILED - No active session found');
        setError('No active session found. Please use the password reset link from your email.');
        setLoading(false);
        return;
      }
      
      console.log('Step 1 SUCCESS - Active session found:', session.user.email);
      
      console.log('Step 2: Updating user password...');
      // Now update the password
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      console.log('Step 2 COMPLETE - Supabase response:', { data, error });

      if (error) {
        console.error('Step 2 FAILED - Supabase error:', error);
        setError(`Error updating password: ${error.message}`);
      } else {
        console.log('Step 2 SUCCESS - Password updated successfully');
        setSuccess('Password changed successfully! You will be redirected to the sign-in page.');
        
        // Clear the form
        setPassword("");
        setConfirmPassword("");
        
        // Redirect to sign-in page after 2 seconds
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      }
    } catch (err) {
      console.error('=== UNEXPECTED ERROR ===', err);
      setError(`An unexpected error occurred: ${err}`);
    } finally {
      console.log('=== PASSWORD CHANGE ATTEMPT FINISHED ===');
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
      <div className="min-h-screen pt-28 lg:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 -top-24 h-64 bg-radial-fade" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric mx-auto mb-4"></div>
              <p>Validating your reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                Change Password
                <span className="block text-electric">Set Your New Password</span>
              </h1>
              <p className="text-muted text-lg">
                {isValidSession 
                  ? `Create a new password for ${email}` 
                  : 'Validating reset link...'
                }
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium mb-1">Invalid Reset Link</p>
                    <p>{error}</p>
                    <p className="text-xs mt-2 text-red-300">
                      You will be redirected to the reset password page automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 text-sm mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium mb-1">Password Changed Successfully</p>
                    <p>{success}</p>
                  </div>
                </div>
              </div>
            )}

            {isValidSession && !success && (
              <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 accent-glow">
                <form onSubmit={handlePasswordChange} className="space-y-6" onSubmitCapture={() => console.log('Form onSubmitCapture triggered')}>
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
                      minLength={8}
                    />
                    
                    {/* Password strength indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted">Password strength:</span>
                          <span className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-muted">
                      <p>Password must be at least 6 characters long</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-colors"
                      placeholder="Confirm your new password"
                      required
                      minLength={8}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="mt-1 text-xs text-green-400">Passwords match</p>
                    )}
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
                    {loading ? "Changing Password..." : "Change Password"}
                  </button>
                  
                  {/* Debug button */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Debug info:');
                      console.log('Password:', password);
                      console.log('Confirm Password:', confirmPassword);
                      console.log('Loading:', loading);
                      console.log('Valid session:', isValidSession);
                    }}
                    className="w-full mt-2 text-xs text-muted hover:text-white"
                  >
                    Debug Info
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

export default function ChangePasswordPage() {
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
      <ChangePasswordContent />
    </Suspense>
  );
}
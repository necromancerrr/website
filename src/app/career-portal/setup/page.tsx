"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function SetupPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('No invite token provided');
      setLoading(false);
      return;
    }

    async function validateToken() {
      try {
        const res = await fetch(`/api/admin/invite/validate?token=${token}`);
        const data = await res.json();

        if (!data.valid) {
          setError(data.error || 'Invalid invite');
        } else {
          setEmail(data.email);
        }
      } catch (err) {
        setError('Failed to validate invite');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      // Success - redirect to homepage to sign in
      router.push('/career-portal/');
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Validating invite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h1 className="text-xl font-medium text-white mb-2">Invalid Invite</h1>
            <p className="text-sm text-zinc-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-white mb-2">
            Set up your account
          </h1>
          <p className="text-sm text-zinc-400">
            Creating account for <span className="text-zinc-300">{email}</span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>
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
                  placeholder="Confirm your password"
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && password.length >= 8 && (
                <p className="mt-1.5 text-xs text-emerald-500 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Passwords match
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          UW Blockchain Career Portal
        </p>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SetupPageContent />
    </Suspense>
  );
}

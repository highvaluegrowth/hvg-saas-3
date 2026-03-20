'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { authService } from '@/features/auth/services/authService';

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email. Please register first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await authService.login({ email, password });
      const uid = credential.user.uid;

      // Check if BaseUserProfile exists
      const profileSnap = await getDoc(doc(db, 'users', uid));
      if (!profileSnap.exists()) {
        router.push('/apply/profile');
      } else {
        router.push('/apply');
      }
    } catch (err: any) {
      const code: string = err?.code ?? '';
      setError(FIREBASE_ERROR_MESSAGES[code] ?? err.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div
        className="rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="mb-7">
          <p
            className="text-xs font-black uppercase tracking-widest mb-1"
            style={{ color: 'rgba(103,232,249,0.7)' }}
          >
            Welcome Back
          </p>
          <h1 className="text-2xl font-black text-white">Log in to continue</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Access your application portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Your password"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #0891B2, #0e7490)',
              color: 'white',
              boxShadow: '0 0 20px rgba(8,145,178,0.3)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in…
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>
      </div>

      {/* Register link */}
      <p className="text-center text-sm mt-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/apply/register" className="font-bold" style={{ color: '#67E8F9' }}>
          Create one
        </Link>
      </p>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '../services/authService';
import { auth } from '@/lib/firebase/client';
import type { RegisterCredentials } from '../types/auth.types';

type Intent = 'operator' | 'resident' | 'job_seeker';

const INTENTS: Array<{
  id: Intent;
  icon: string;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}> = [
  {
    id: 'operator',
    icon: 'H',
    label: 'I run a recovery house',
    description: 'Manage your properties, staff, and residents as a house operator or admin.',
    color: '#0891B2',
    bg: 'rgba(8,145,178,0.06)',
    border: '1px solid rgba(8,145,178,0.25)',
  },
  {
    id: 'resident',
    icon: 'B',
    label: 'I need a sober living bed',
    description: 'Find available beds, apply for housing, and access recovery support resources.',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    border: '1px solid rgba(5,150,105,0.25)',
  },
  {
    id: 'job_seeker',
    icon: 'S',
    label: 'I am looking for a staff position',
    description: 'Apply to work at a recovery house as staff, house manager, or support staff.',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.06)',
    border: '1px solid rgba(124,58,237,0.25)',
  },
];

const ROLE_MAP: Record<Intent, string> = {
  operator: 'tenant_admin',
  resident: 'resident',
  job_seeker: 'staff',
};

const DESTINATION_MAP: Record<Intent, string> = {
  operator: '/apply/tenant',
  resident: '/apply/bed',
  job_seeker: '/apply/staff',
};

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectIntent = (id: Intent) => {
    setIntent(id);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.register(credentials);

      // Set initial role based on chosen intent
      if (intent && auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          await fetch('/api/auth/init-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ intentRole: ROLE_MAP[intent] }),
          });
          // Force token refresh so claims propagate to client
          await auth.currentUser.getIdToken(true);
        } catch {
          // Non-fatal — user can still proceed
        }
      }

      const destination = intent ? DESTINATION_MAP[intent] : '/login?registered=true';
      router.push(destination);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await authService.loginWithGoogle();
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      const tenantId = idTokenResult.claims.tenant_id as string | undefined;
      if (tenantId) {
        router.push(`/${tenantId}`);
      } else {
        router.push('/create-tenant');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 0: Intent picker ──────────────────────────────────────────────────
  if (step === 0) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">Welcome to HVG</CardTitle>
          <p className="text-sm text-center text-muted-foreground mt-1">
            What best describes you? We will set up the right experience.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {INTENTS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectIntent(item.id)}
              className="w-full text-left rounded-xl p-4 flex items-start gap-4 transition-all duration-150 hover:scale-[1.01] hover:shadow-md cursor-pointer"
              style={{ background: item.bg, border: item.border }}
            >
              <span
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white mt-0.5"
                style={{ background: item.color }}
              >
                {item.icon}
              </span>
              <div>
                <p className="font-semibold text-sm" style={{ color: item.color }}>{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
              </div>
            </button>
          ))}
          <div className="text-center text-sm pt-2 text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Step 1: Registration form ──────────────────────────────────────────────
  const selectedIntent = INTENTS.find((i) => i.id === intent);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setStep(0)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            back
          </button>
          {selectedIntent && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: selectedIntent.bg, color: selectedIntent.color, border: selectedIntent.border }}
            >
              {selectedIntent.label}
            </span>
          )}
        </div>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              value={credentials.displayName}
              onChange={(e) => setCredentials({ ...credentials, displayName: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="min 6 characters"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div className="text-center text-sm pt-4 text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

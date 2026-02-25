# Phase 1: Foundation & Authentication - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Next.js foundation with Firebase authentication and multi-tenant routing structure.

**Architecture:** Feature-driven architecture with self-contained modules. Incremental setup starting with Next.js, layering Firebase SDK, building auth UI, then adding RBAC and multi-tenancy. Each feature (auth, tenant, user) is independent with its own components, hooks, services, and types.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Firebase SDK v9+, Firebase Admin SDK

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`
- Create: `.gitignore`, `.env.local.example`

**Step 1: Initialize Next.js with TypeScript and Tailwind**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --skip-git
```

Expected: Creates Next.js project with App Router, TypeScript, Tailwind CSS

**Step 2: Clean up default files**

Remove unnecessary default files:
```bash
rm -rf app/page.tsx app/globals.css public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

**Step 3: Create base globals.css**

Create: `app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 4: Create environment variable template**

Create: `.env.local.example`
```
# Firebase Web SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
```

**Step 5: Update .gitignore**

Create: `.gitignore`
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# firebase
firebase-debug.log
.firebase/
```

**Step 6: Commit initial setup**

```bash
git add .
git commit -m "feat: initialize Next.js 14 with TypeScript and Tailwind CSS"
```

---

## Task 2: Create Feature-Driven Folder Structure

**Files:**
- Create: Directory structure for features, components, lib, hooks, types

**Step 1: Create directory structure**

Run:
```bash
mkdir -p app/\(auth\)/login app/\(auth\)/register
mkdir -p app/\(dashboard\)/\[tenantId\]
mkdir -p app/api/auth/custom-claims
mkdir -p features/auth/{components,hooks,services,types}
mkdir -p features/tenant/{components,middleware,types}
mkdir -p features/user/{components,hooks,types}
mkdir -p lib/firebase lib/utils
mkdir -p components/ui
mkdir -p types
```

**Step 2: Create TypeScript path aliases**

Modify: `tsconfig.json`

Add to `compilerOptions`:
```json
{
  "compilerOptions": {
    // ... existing config
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/features/*": ["./features/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

**Step 3: Create barrel exports for features**

Create: `features/auth/index.ts`
```typescript
export * from './components';
export * from './hooks';
export * from './services';
export * from './types';
```

Create: `features/tenant/index.ts`
```typescript
export * from './components';
export * from './middleware';
export * from './types';
```

Create: `features/user/index.ts`
```typescript
export * from './components';
export * from './hooks';
export * from './types';
```

**Step 4: Commit folder structure**

```bash
git add .
git commit -m "feat: create feature-driven folder structure"
```

---

## Task 3: Install Firebase Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Firebase packages**

Run:
```bash
npm install firebase firebase-admin
```

Expected: Installs firebase@^10.x and firebase-admin@^12.x

**Step 2: Install additional dependencies**

Run:
```bash
npm install --save-dev @types/node
```

**Step 3: Commit dependencies**

```bash
git add package.json package-lock.json
git commit -m "chore: add Firebase SDK dependencies"
```

---

## Task 4: Configure Firebase Client SDK

**Files:**
- Create: `lib/firebase/client.ts`
- Create: `lib/firebase/config.ts`

**Step 1: Create Firebase config**

Create: `lib/firebase/config.ts`
```typescript
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

**Step 2: Create Firebase client initialization**

Create: `lib/firebase/client.ts`
```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { app };
```

**Step 3: Create barrel export**

Create: `lib/firebase/index.ts`
```typescript
export * from './client';
export * from './config';
```

**Step 4: Commit Firebase client config**

```bash
git add lib/firebase/
git commit -m "feat: configure Firebase client SDK"
```

---

## Task 5: Configure Firebase Admin SDK

**Files:**
- Create: `lib/firebase/admin.ts`

**Step 1: Create Admin SDK initialization**

Create: `lib/firebase/admin.ts`
```typescript
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export { adminApp };
```

**Step 2: Update barrel export**

Modify: `lib/firebase/index.ts`
```typescript
export * from './client';
export * from './config';

// Admin SDK (server-side only)
export * from './admin';
```

**Step 3: Commit Admin SDK config**

```bash
git add lib/firebase/admin.ts lib/firebase/index.ts
git commit -m "feat: configure Firebase Admin SDK"
```

---

## Task 6: Define Core TypeScript Types

**Files:**
- Create: `features/auth/types/auth.types.ts`
- Create: `features/tenant/types/tenant.types.ts`
- Create: `features/user/types/user.types.ts`

**Step 1: Create auth types**

Create: `features/auth/types/auth.types.ts`
```typescript
export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'staff_admin'
  | 'staff'
  | 'resident';

export interface User {
  uid: string;
  email: string;
  displayName?: string | null;
  tenantId?: string;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}
```

**Step 2: Create tenant types**

Create: `features/tenant/types/tenant.types.ts`
```typescript
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantMember {
  userId: string;
  tenantId: string;
  role: import('../auth/types/auth.types').UserRole;
  addedAt: Date;
}
```

**Step 3: Create user types**

Create: `features/user/types/user.types.ts`
```typescript
import { UserRole } from '@/features/auth/types/auth.types';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  tenantId?: string;
  role?: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 4: Create barrel exports**

Create: `features/auth/types/index.ts`
```typescript
export * from './auth.types';
```

Create: `features/tenant/types/index.ts`
```typescript
export * from './tenant.types';
```

Create: `features/user/types/index.ts`
```typescript
export * from './user.types';
```

**Step 5: Commit type definitions**

```bash
git add features/auth/types/ features/tenant/types/ features/user/types/
git commit -m "feat: define core TypeScript types for auth, tenant, user"
```

---

## Task 7: Create Authentication Service

**Files:**
- Create: `features/auth/services/authService.ts`
- Create: `lib/utils/errors.ts`

**Step 1: Create error utilities**

Create: `lib/utils/errors.ts`
```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(code, message, 401);
    this.name = 'AuthError';
  }
}

export class TenantError extends AppError {
  constructor(message: string) {
    super('TENANT_ERROR', message, 403);
    this.name = 'TenantError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}
```

**Step 2: Create auth service**

Create: `features/auth/services/authService.ts`
```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { AuthError } from '@/lib/utils/errors';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const authService = {
  async register(credentials: RegisterCredentials): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      return userCredential;
    } catch (error: any) {
      throw new AuthError(
        error.message || 'Registration failed',
        error.code
      );
    }
  },

  async login(credentials: LoginCredentials): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      return userCredential;
    } catch (error: any) {
      throw new AuthError(
        error.message || 'Login failed',
        error.code
      );
    }
  },

  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new AuthError(
        error.message || 'Logout failed',
        error.code
      );
    }
  },

  async getCurrentUser() {
    return auth.currentUser;
  },

  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  },
};
```

**Step 3: Create barrel exports**

Create: `features/auth/services/index.ts`
```typescript
export * from './authService';
```

Create: `lib/utils/index.ts`
```typescript
export * from './errors';
```

**Step 4: Commit auth service**

```bash
git add features/auth/services/ lib/utils/
git commit -m "feat: create authentication service and error utilities"
```

---

## Task 8: Create useAuth Hook

**Files:**
- Create: `features/auth/hooks/useAuth.ts`

**Step 1: Create useAuth hook**

Create: `features/auth/hooks/useAuth.ts`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import type { User, AuthState, UserRole } from '../types/auth.types';

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            // Get custom claims from ID token
            const idTokenResult = await firebaseUser.getIdTokenResult();

            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName,
              tenantId: idTokenResult.claims.tenant_id as string | undefined,
              role: idTokenResult.claims.role as UserRole | undefined,
            };

            setState({
              user,
              loading: false,
              error: null,
            });
          } catch (error: any) {
            setState({
              user: null,
              loading: false,
              error: error.message,
            });
          }
        } else {
          setState({
            user: null,
            loading: false,
            error: null,
          });
        }
      },
      (error) => {
        setState({
          user: null,
          loading: false,
          error: error.message,
        });
      }
    );

    return unsubscribe;
  }, []);

  return state;
}
```

**Step 2: Create barrel export**

Create: `features/auth/hooks/index.ts`
```typescript
export * from './useAuth';
```

**Step 3: Commit useAuth hook**

```bash
git add features/auth/hooks/
git commit -m "feat: create useAuth hook for client-side auth state"
```

---

## Task 9: Create UI Components (Button, Input, Card)

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Card.tsx`

**Step 1: Create Button component**

Create: `components/ui/Button.tsx`
```typescript
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

**Step 2: Create Input component**

Create: `components/ui/Input.tsx`
```typescript
import React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

**Step 3: Create Card component**

Create: `components/ui/Card.tsx`
```typescript
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';
```

**Step 4: Install class-variance-authority**

Run:
```bash
npm install class-variance-authority clsx tailwind-merge
```

**Step 5: Create cn utility**

Create: `lib/utils/cn.ts`
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 6: Update utils barrel export**

Modify: `lib/utils/index.ts`
```typescript
export * from './errors';
export * from './cn';
```

**Step 7: Create UI barrel export**

Create: `components/ui/index.ts`
```typescript
export * from './Button';
export * from './Input';
export * from './Card';
```

**Step 8: Commit UI components**

```bash
git add components/ui/ lib/utils/cn.ts package.json package-lock.json
git commit -m "feat: create UI components (Button, Input, Card)"
```

---

## Task 10: Create Login Form Component

**Files:**
- Create: `features/auth/components/LoginForm.tsx`

**Step 1: Create LoginForm component**

Create: `features/auth/components/LoginForm.tsx`
```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '../services/authService';
import type { LoginCredentials } from '../types/auth.types';

export function LoginForm() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.login(credentials);
      // TODO: Redirect to tenant selection or dashboard
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login to High Value Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="text-center text-sm">
            Don't have an account?{' '}
            <a href="/register" className="text-primary hover:underline">
              Register
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create components barrel export**

Create: `features/auth/components/index.ts`
```typescript
export * from './LoginForm';
```

**Step 3: Commit LoginForm**

```bash
git add features/auth/components/
git commit -m "feat: create LoginForm component"
```

---

## Task 11: Create Register Form Component

**Files:**
- Create: `features/auth/components/RegisterForm.tsx`

**Step 1: Create RegisterForm component**

Create: `features/auth/components/RegisterForm.tsx`
```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '../services/authService';
import type { RegisterCredentials } from '../types/auth.types';

export function RegisterForm() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.register(credentials);
      // After registration, redirect to login
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
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
            <label htmlFor="displayName" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              value={credentials.displayName}
              onChange={(e) =>
                setCredentials({ ...credentials, displayName: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
              disabled={loading}
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">
              Login
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Update components barrel export**

Modify: `features/auth/components/index.ts`
```typescript
export * from './LoginForm';
export * from './RegisterForm';
```

**Step 3: Commit RegisterForm**

```bash
git add features/auth/components/
git commit -m "feat: create RegisterForm component"
```

---

## Task 12: Create Auth Pages (Login & Register)

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/(auth)/layout.tsx`

**Step 1: Create auth layout**

Create: `app/(auth)/layout.tsx`
```typescript
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {children}
    </div>
  );
}
```

**Step 2: Create login page**

Create: `app/(auth)/login/page.tsx`
```typescript
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return <LoginForm />;
}
```

**Step 3: Create register page**

Create: `app/(auth)/register/page.tsx`
```typescript
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return <RegisterForm />;
}
```

**Step 4: Create root layout**

Create: `app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'High Value Growth',
  description: 'Multi-tenant platform for sober-living house management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Step 5: Create temporary home page**

Create: `app/page.tsx`
```typescript
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
}
```

**Step 6: Commit auth pages**

```bash
git add app/
git commit -m "feat: create auth pages (login, register) and layouts"
```

---

## Task 13: Create Custom Claims API Route

**Files:**
- Create: `app/api/auth/custom-claims/route.ts`

**Step 1: Create custom claims API route**

Create: `app/api/auth/custom-claims/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import type { UserRole } from '@/features/auth/types/auth.types';

export async function POST(request: NextRequest) {
  try {
    const { uid, tenantId, role } = await request.json();

    if (!uid || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, role' },
        { status: 400 }
      );
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, {
      tenant_id: tenantId || null,
      role: role as UserRole,
    });

    return NextResponse.json({
      success: true,
      message: 'Custom claims set successfully',
    });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set custom claims' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'Missing uid parameter' },
        { status: 400 }
      );
    }

    const user = await adminAuth.getUser(uid);

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      customClaims: user.customClaims || {},
    });
  } catch (error: any) {
    console.error('Error getting user claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user claims' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit custom claims API**

```bash
git add app/api/auth/custom-claims/
git commit -m "feat: create custom claims API route"
```

---

## Task 14: Create Tenant Validation Middleware

**Files:**
- Create: `features/tenant/middleware/tenantValidation.ts`
- Create: `middleware.ts`

**Step 1: Create tenant validation utility**

Create: `features/tenant/middleware/tenantValidation.ts`
```typescript
import { adminAuth } from '@/lib/firebase/admin';
import { TenantError } from '@/lib/utils/errors';

export async function validateTenantAccess(
  token: string,
  tenantId: string
): Promise<boolean> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Super admins can access any tenant
    if (decodedToken.role === 'super_admin') {
      return true;
    }

    // Other users must match tenant_id
    if (decodedToken.tenant_id !== tenantId) {
      throw new TenantError('Unauthorized access to tenant');
    }

    return true;
  } catch (error) {
    throw new TenantError('Invalid tenant access');
  }
}
```

**Step 2: Create Next.js middleware**

Create: `middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for auth routes and API routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Extract tenant ID from path (if present)
  const tenantMatch = pathname.match(/^\/([^\/]+)/);
  const tenantId = tenantMatch ? tenantMatch[1] : null;

  // Get session token from cookie
  const token = request.cookies.get('__session')?.value;

  if (!token) {
    // No token, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);

    // If accessing a tenant route, validate tenant access
    if (tenantId) {
      const isSuperAdmin = decodedToken.role === 'super_admin';
      const matchesTenant = decodedToken.tenant_id === tenantId;

      if (!isSuperAdmin && !matchesTenant) {
        // Unauthorized access to tenant
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

**Step 3: Create middleware barrel export**

Create: `features/tenant/middleware/index.ts`
```typescript
export * from './tenantValidation';
```

**Step 4: Commit middleware**

```bash
git add features/tenant/middleware/ middleware.ts
git commit -m "feat: create tenant validation and Next.js middleware"
```

---

## Task 15: Create Basic Firestore Security Rules

**Files:**
- Create: `firestore.rules`

**Step 1: Create Firestore security rules**

Create: `firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isSuperAdmin() {
      return isAuthenticated() && request.auth.token.role == 'super_admin';
    }

    function isTenantMember(tenantId) {
      return isAuthenticated() && request.auth.token.tenant_id == tenantId;
    }

    function isTenantAdmin(tenantId) {
      return isTenantMember(tenantId) &&
             request.auth.token.role == 'tenant_admin';
    }

    // Tenant data access rules
    match /tenants/{tenantId} {
      // Allow super admins to access any tenant
      allow read: if isSuperAdmin() || isTenantMember(tenantId);
      allow create: if isSuperAdmin();
      allow update, delete: if isSuperAdmin() || isTenantAdmin(tenantId);

      // Nested collections under tenant
      match /{document=**} {
        allow read: if isSuperAdmin() || isTenantMember(tenantId);
        allow write: if isSuperAdmin() || isTenantAdmin(tenantId);
      }
    }

    // Conversations (AI chat) - global access for authenticated users
    match /conversations/{conversationId} {
      allow read, write: if isAuthenticated() &&
                           request.auth.uid == resource.data.userId;
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Step 2: Commit Firestore rules**

```bash
git add firestore.rules
git commit -m "feat: create Firestore security rules with tenant isolation"
```

---

## Task 16: Create Firebase Configuration File

**Files:**
- Create: `firebase.json`

**Step 1: Create firebase.json**

Create: `firebase.json`
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

**Step 2: Create empty indexes file**

Create: `firestore.indexes.json`
```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

**Step 3: Commit Firebase config**

```bash
git add firebase.json firestore.indexes.json
git commit -m "feat: create Firebase configuration file"
```

---

## Task 17: Create README with Setup Instructions

**Files:**
- Create: `README.md`

**Step 1: Create README**

Create: `README.md`
```markdown
# High Value Growth

Multi-tenant SaaS platform for managing sober-living houses and resident recovery support.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Cloud Functions)
- **Mobile:** Flutter (planned)
- **AI:** Claude 3.5 Sonnet (planned)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Firebase CLI: `npm install -g firebase-tools`

### Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/peteroleary/highvaluegrowth.git
   cd highvaluegrowth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Authentication (Email/Password)
   - Create Firestore database

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in Firebase credentials in `.env.local`:
   - Get Web SDK config from Firebase Console → Project Settings → General
   - Get Admin SDK credentials from Firebase Console → Project Settings → Service Accounts

5. **Deploy Firestore rules** (optional, for local development use emulator)
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Firebase Emulators (Recommended for Development)

Run Firebase emulators locally:

```bash
firebase emulators:start
```

This starts:
- Authentication emulator: `localhost:9099`
- Firestore emulator: `localhost:8080`
- Emulator UI: `localhost:4000`

## Project Structure

```
highvaluegrowth/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── features/              # Feature-driven modules
│   ├── auth/             # Authentication feature
│   ├── tenant/           # Multi-tenancy feature
│   └── user/             # User management feature
├── components/           # Shared components
│   └── ui/              # UI primitives
├── lib/                 # Core utilities
│   ├── firebase/        # Firebase configuration
│   └── utils/           # Utility functions
└── types/               # Global TypeScript types
```

## Development Phases

- [x] **Phase 1:** Foundation & Authentication (Current)
- [ ] **Phase 2:** Core Data Models & Dashboard
- [ ] **Phase 3:** Events, Transportation
- [ ] **Phase 4:** Chores, Incidents
- [ ] **Phase 5:** Calendar, Kanban -> convert any object to calendar event and/or kanban card
- [ ] **Phase 6:** Community, Chat -> user-to-user, house-wide, group chats, tenant broadcasts
- [ ] **Phase 7:** Courses, Classes -> create, distribute, track progress
- [ ] **Phase 8:** AI Chat (Tenant) -> Gemini (up to 3.1)
- [ ] **Phase 9:** Payments, Rent, Fines (Stripe)
- [ ] **Phase 10:** Testing & Deployment
- [ ] **Phase 11:** Mobile App (Flutter) -> resident-facing portal, AI recovery guide, complete SaaS sync

## Authentication Flow

1. User registers via `/register`
2. Firebase creates user account
3. Server sets custom claims (tenant_id, role)
4. User logs in via `/login`
5. Middleware validates tenant access
6. User accesses `/[tenantId]/dashboard`

## Multi-Tenancy

All tenant data is scoped under `/tenants/{tenantId}/` in Firestore. Security rules enforce:
- Super admins can access all tenants
- Other users can only access their assigned tenant
- Custom claims (`tenant_id`, `role`) validate access

## License

MIT
```

**Step 2: Commit README**

```bash
git add README.md
git commit -m "docs: create README with setup instructions"
```

---

## Task 18: Create CLAUDE.md for Project Context

**Files:**
- Create: `CLAUDE.md`

**Step 1: Create CLAUDE.md**

Create: `CLAUDE.md`
```markdown
# High Value Growth - Claude Context

## Project Overview

High Value Growth (HVG) is a multi-tenant SaaS platform for managing sober-living houses and supporting residents in recovery through AI-powered tools.

## Current Status: Phase 1 Complete ✅

**Implemented:**
- Next.js 14 project with App Router, TypeScript, Tailwind CSS
- Feature-driven architecture (auth, tenant, user features)
- Firebase Web SDK and Admin SDK configuration
- Email/password authentication
- Custom claims for RBAC (role-based access control)
- Multi-tenant routing with middleware protection
- Firestore security rules with tenant isolation
- Login and registration UI
- useAuth hook for client-side auth state

## Architecture Decisions

### Feature-Driven Structure
Code is organized by feature/domain rather than technical layer:
- `features/auth/` - Authentication (components, hooks, services, types)
- `features/tenant/` - Multi-tenancy (middleware, validation)
- `features/user/` - User management
- `components/ui/` - Shared UI primitives
- `lib/` - Core utilities (Firebase, errors, utils)

**Why:** Each feature is self-contained, making it easy to update one component without affecting others. Minimal cross-feature dependencies.

### Multi-Tenancy Pattern
All tenant data scoped under `/tenants/{tenantId}/` in Firestore. Custom claims (`tenant_id`, `role`) stored in Firebase Auth tokens for server-side validation.

**Roles:**
- `super_admin` - Platform owner, access all tenants
- `tenant_admin` - Organization owner, full tenant access
- `staff_admin` - Staff manager
- `staff` - House staff
- `resident` - Resident (mobile app primary user)

### Authentication Flow
1. User registers → Firebase Auth creates user
2. Server API sets custom claims (`tenant_id`, `role`)
3. User logs in → ID token includes claims
4. Next.js middleware validates tenant access
5. Firestore rules enforce tenant isolation

## Key Files

**Firebase Config:**
- `lib/firebase/client.ts` - Web SDK (client-side)
- `lib/firebase/admin.ts` - Admin SDK (server-side)
- `firestore.rules` - Security rules

**Authentication:**
- `features/auth/hooks/useAuth.ts` - Auth state management
- `features/auth/services/authService.ts` - Auth operations
- `app/api/auth/custom-claims/route.ts` - Custom claims API

**Multi-Tenancy:**
- `middleware.ts` - Route protection
- `features/tenant/middleware/tenantValidation.ts` - Tenant validation

## Next Steps (Phase 2)

Build core data models and dashboard:
- Define Firestore schema (House, Resident, Staff, Incident)
- Create tenant-scoped dashboard layout
- Implement CRUD operations for houses, residents, staff
- Build incident reporting system
- Add real-time Firestore listeners

## Development Guidelines

**Principles:**
- DRY (Don't Repeat Yourself)
- YAGNI (You Aren't Gonna Need It)
- TDD (Test-Driven Development)
- Frequent commits with descriptive messages

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `chore:` - Dependencies, config

## Firebase Setup

**Environment Variables Required:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
```

**Emulators for Local Development:**
```bash
firebase emulators:start
```

## Testing Strategy

**Unit Tests:** Vitest for services and utilities
**Integration Tests:** Test auth flow, tenant isolation
**E2E Tests:** Playwright for user flows (planned)

## Deployment

**Hosting Options:**
- Firebase Hosting (configured in `firebase.json`)
- Vercel (alternative)

**Production Checklist:**
- [ ] Firebase production project created
- [ ] Environment variables configured
- [ ] Firestore rules deployed
- [ ] Custom domain configured
- [ ] SSL certificate active
```

**Step 2: Commit CLAUDE.md**

```bash
git add CLAUDE.md
git commit -m "docs: create CLAUDE.md for project context"
```

---

## Verification

After completing all tasks, verify Phase 1:

**Step 1: Start development server**

Run:
```bash
npm run dev
```

Expected: Server runs on `http://localhost:3000` without errors

**Step 2: Test registration flow**

1. Navigate to `http://localhost:3000/register`
2. Fill in email and password
3. Submit form
4. Expected: Redirects to `/login?registered=true`

**Step 3: Set custom claims (manual)**

In Firebase Console:
1. Go to Authentication → Users
2. Note the user UID
3. Use Firebase CLI or Admin SDK to set claims

Or use API route:
```bash
curl -X POST http://localhost:3000/api/auth/custom-claims \
  -H "Content-Type: application/json" \
  -d '{"uid":"USER_UID","role":"tenant_admin","tenantId":"tenant1"}'
```

**Step 4: Test login flow**

1. Navigate to `http://localhost:3000/login`
2. Enter registered email and password
3. Submit form
4. Expected: User logged in (check browser console for auth state)

**Step 5: Verify Firestore rules (emulator)**

Run:
```bash
firebase emulators:start
```

In emulator UI (`http://localhost:4000`), test:
- Cross-tenant access should fail
- Same-tenant access should succeed
- Super admin access should work for all tenants

**Step 6: TypeScript compilation**

Run:
```bash
npm run build
```

Expected: No TypeScript errors, successful build

---

## Plan Complete

Phase 1 implementation is now complete! All foundation components are in place:

✅ Next.js project initialized
✅ Feature-driven folder structure created
✅ Firebase SDK configured (client + admin)
✅ TypeScript types defined
✅ Authentication service implemented
✅ useAuth hook created
✅ UI components built (Button, Input, Card)
✅ Login and Register forms created
✅ Auth pages implemented
✅ Custom claims API route created
✅ Tenant validation middleware implemented
✅ Firestore security rules created
✅ Documentation written (README, CLAUDE.md)

**Next:** Begin Phase 2 - Core Data Models & Dashboard

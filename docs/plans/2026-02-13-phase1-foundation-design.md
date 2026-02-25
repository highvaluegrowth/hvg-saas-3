# Phase 1: Foundation & Authentication - Design Document

**Date:** 2026-02-13
**Phase:** Phase 1 of 6
**Goal:** Set up project infrastructure and multi-tenant authentication

---

## Context

High Value Growth (HVG) is a multi-tenant SaaS platform for managing sober-living houses. Phase 1 establishes the foundation: Next.js project setup, Firebase integration, authentication system, and multi-tenant routing structure.

**Why this matters:** A solid foundation with proper feature-driven architecture prevents future refactoring and enables independent component updates.

---

## Design Decisions

### 1. Feature-Driven Architecture

We'll organize code by feature/domain rather than technical layer:

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/
│   └── [tenantId]/
│       ├── layout.tsx
│       ├── page.tsx
│       └── settings/
│           └── page.tsx
└── api/
    └── auth/
        └── custom-claims/
            └── route.ts

features/
├── auth/
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── services/
│   │   └── authService.ts
│   └── types/
│       └── auth.types.ts
├── tenant/
│   ├── components/
│   │   └── TenantSwitcher.tsx
│   ├── middleware/
│   │   └── tenantValidation.ts
│   └── types/
│       └── tenant.types.ts
└── user/
    ├── components/
    ├── hooks/
    └── types/

lib/
├── firebase/
│   ├── admin.ts
│   ├── client.ts
│   └── config.ts
└── utils/
    ├── errors.ts
    └── validation.ts

components/
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    └── Card.tsx
```

**Benefits:**
- Each feature is self-contained (components, hooks, services, types together)
- Easy to locate and modify feature-specific code
- Minimal cross-feature dependencies
- Shared UI components in `/components/ui`
- Core utilities in `/lib`

### 2. Implementation Sequence

**Incremental Setup (Recommended Approach):**

1. **Next.js Initialization**
   - Use `create-next-app` with TypeScript, Tailwind, App Router
   - Clean up default files
   - Set up ESLint and Prettier

2. **Project Structure**
   - Create feature-driven folder structure
   - Add barrel exports (index.ts) for clean imports
   - Configure path aliases in tsconfig.json

3. **Firebase Configuration**
   - Create Firebase project via console
   - Install Firebase SDK packages
   - Configure client SDK (`lib/firebase/client.ts`)
   - Configure Admin SDK (`lib/firebase/admin.ts`)
   - Set up environment variables

4. **Authentication Feature**
   - Build `features/auth/` with components, hooks, services
   - Implement email/password registration
   - Implement login flow
   - Create useAuth hook for client-side state
   - Build auth UI pages

5. **RBAC System**
   - Create custom claims API route
   - Build middleware for role validation
   - Implement tenant_id claim management
   - Add role-based route protection

6. **Multi-Tenant Routing**
   - Create `[tenantId]` dynamic routes
   - Build tenant validation middleware
   - Implement tenant switcher for super admins
   - Set up Firestore security rules

---

## Component Design

### Authentication Flow

```
User Registration
    ↓
[RegisterForm] → authService.register()
    ↓
Firebase Auth creates user
    ↓
API: /api/auth/custom-claims
    ↓
Admin SDK adds claims (tenant_id, role)
    ↓
User redirected to login

User Login
    ↓
[LoginForm] → authService.login()
    ↓
Firebase Auth signs in
    ↓
useAuth hook updates state
    ↓
ID token includes custom claims
    ↓
Middleware validates tenant_id
    ↓
User accesses /[tenantId]/dashboard
```

### Key Interfaces

```typescript
// features/auth/types/auth.types.ts
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  tenantId?: string;
  role?: UserRole;
}

export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'staff_admin'
  | 'staff'
  | 'resident';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// features/tenant/types/tenant.types.ts
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  ownerId: string;
}
```

---

## Data Flow

### Authentication State Management

Using React Context + Firebase Auth listener:

```typescript
// features/auth/hooks/useAuth.ts
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idTokenResult = await firebaseUser.getIdTokenResult();
        setState({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            tenantId: idTokenResult.claims.tenant_id as string,
            role: idTokenResult.claims.role as UserRole
          },
          loading: false,
          error: null
        });
      } else {
        setState({ user: null, loading: false, error: null });
      }
    });

    return unsubscribe;
  }, []);

  return state;
}
```

### Middleware Protection

```typescript
// middleware.ts (Next.js middleware)
export async function middleware(request: NextRequest) {
  const tenantId = request.nextUrl.pathname.split('/')[1];
  const token = request.cookies.get('__session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Validate tenant access
    if (decodedToken.tenant_id !== tenantId &&
        decodedToken.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/:tenantId/(.*)']
};
```

---

## Error Handling

### Centralized Error Types

```typescript
// lib/utils/errors.ts
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
  constructor(message: string) {
    super('AUTH_ERROR', message, 401);
  }
}

export class TenantError extends AppError {
  constructor(message: string) {
    super('TENANT_ERROR', message, 403);
  }
}
```

### Error Boundaries

```typescript
// features/auth/components/AuthErrorBoundary.tsx
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="error-container">
          <h2>Authentication Error</h2>
          <p>{error.message}</p>
          <Button onClick={() => window.location.href = '/login'}>
            Return to Login
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// features/auth/services/__tests__/authService.test.ts
describe('authService', () => {
  it('should register user with email and password', async () => {
    const result = await authService.register('test@example.com', 'password123');
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });

  it('should throw error for invalid email', async () => {
    await expect(
      authService.register('invalid', 'password123')
    ).rejects.toThrow(AuthError);
  });
});
```

### Integration Tests

```typescript
// features/auth/__tests__/auth.integration.test.ts
describe('Authentication Flow', () => {
  it('should complete registration to login flow', async () => {
    // Register
    await authService.register('user@test.com', 'password123');

    // Verify custom claims set
    const user = await adminAuth.getUserByEmail('user@test.com');
    expect(user.customClaims?.role).toBeDefined();

    // Login
    const loginResult = await authService.login('user@test.com', 'password123');
    expect(loginResult.user.tenantId).toBeDefined();
  });
});
```

---

## Verification Checklist

After implementation, verify:

- [ ] Next.js dev server runs without errors (`npm run dev`)
- [ ] Firebase project created and connected
- [ ] User can register with email/password
- [ ] Custom claims are set correctly (check Firebase Console)
- [ ] User can login and access tenant routes
- [ ] Middleware blocks unauthorized tenant access
- [ ] useAuth hook provides correct user state
- [ ] Firestore security rules prevent cross-tenant access
- [ ] TypeScript compiles without errors
- [ ] ESLint shows no warnings

---

## Critical Files

**Configuration:**
- `lib/firebase/client.ts` - Firebase Web SDK
- `lib/firebase/admin.ts` - Firebase Admin SDK
- `.env.local` - Environment variables
- `middleware.ts` - Route protection

**Authentication Feature:**
- `features/auth/hooks/useAuth.ts` - Auth state hook
- `features/auth/services/authService.ts` - Auth operations
- `features/auth/components/LoginForm.tsx` - Login UI
- `features/auth/components/RegisterForm.tsx` - Register UI
- `app/api/auth/custom-claims/route.ts` - Claims API

**Multi-Tenancy:**
- `features/tenant/middleware/tenantValidation.ts` - Tenant validation
- `features/tenant/components/TenantSwitcher.tsx` - Tenant switcher UI
- `app/(dashboard)/[tenantId]/layout.tsx` - Tenant layout

**Security:**
- `firestore.rules` - Firestore security rules

---

## Next Steps

After Phase 1 completion:
1. Verify all checklist items
2. Test cross-tenant isolation
3. Begin Phase 2: Core Data Models & Dashboard
4. Expand Firestore schema with tenant collections

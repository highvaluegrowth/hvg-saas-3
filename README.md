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
- [ ] **Phase 3:** Mobile App (Flutter)
- [ ] **Phase 4:** Advanced Features
- [ ] **Phase 5:** Payments (Stripe)
- [ ] **Phase 6:** Testing & Deployment

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

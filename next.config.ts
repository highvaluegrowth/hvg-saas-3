import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    // Firebase Admin SDK and all sub-path imports
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/auth',
    'firebase-admin/firestore',
    'firebase-admin/storage',
    'firebase-admin/messaging',
    // Firebase Admin transitive dependencies
    '@google-cloud/firestore',
    '@google-cloud/storage',
    'google-gax',
    '@grpc/grpc-js',
    '@grpc/proto-loader',
    'google-auth-library',
    'googleapis',
    // Firebase client (if accidentally imported server-side)
    '@firebase/app',
    // Stripe (Node.js only)
    'stripe',
  ],
};

export default nextConfig;

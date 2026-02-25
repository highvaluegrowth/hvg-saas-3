import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'firebase-admin',
    '@firebase/app',
    'google-auth-library',
    'googleapis',
  ],
};

export default nextConfig;

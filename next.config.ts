import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No custom headers needed - Firebase Auth popup handles COOP/COEP automatically
  
  // Server external packages - prevent bundling issues with Firebase Admin SDK
  // These packages should not be bundled into the server chunks
  serverExternalPackages: [
    'firebase-admin',
  ],
};

export default nextConfig;

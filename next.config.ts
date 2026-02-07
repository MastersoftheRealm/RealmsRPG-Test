import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No custom headers needed - Firebase Auth popup handles COOP/COEP automatically
  //
  // serverExternalPackages: firebase-admin should be external (not bundled).
  // Next.js 16 defaults to Turbopack which hashes externals -> ERR_MODULE_NOT_FOUND on Firebase.
  // Must use "next build --webpack" (see package.json "build" script).
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;

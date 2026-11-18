import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */

// Security headers (security level 5: transport / network)
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig = {
  poweredByHeader: false,
  // A separate build folder can be chosen (NEXT_DIST_DIR) so a test build does
  // not overwrite the .next folder of a running "npm run dev".
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

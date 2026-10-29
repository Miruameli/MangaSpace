import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseOrigin = "";
let supabaseWsOrigin = "";
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl);
    supabaseOrigin = u.origin;
    supabaseWsOrigin = u.origin.replace(/^http/, "ws");
  }
} catch {
  // ignore invalid URL
}
const connectSrc = ["'self'", "https://api.mangadex.org", supabaseOrigin, supabaseWsOrigin]
  .filter(Boolean)
  .join(" ");

// Security HTTP headers. CSP is the primary XSS control.
// - script-src/style-src keep 'unsafe-inline': Next.js 16 emits inline
//   scripts at SSR (Turbopack bootstrap + __next_f flight hydration) and
//   app/layout.tsx injects its own theme-init inline script; removing it
//   blocks hydration and blanks the page (issue #32 needs a nonce strategy).
// - The directives below are strictly ADDITIVE restrictions (issue #53):
//   object-src 'none' (block <object>/<embed>), base-uri 'self' (block
//   <base> hijacking), form-action 'self' (forms are JS-driven & same-origin),
//   upgrade-insecure-requests (all resources already https).
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: `default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src ${connectSrc}; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-uri /api/csp-report`,
  },
];

const nextConfig: NextConfig = {
  cacheComponents: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "uploads.mangadex.org" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
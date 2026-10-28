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

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: `default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src ${connectSrc}; frame-ancestors 'self'`,
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
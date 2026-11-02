// Site URL helper — single source of truth for the canonical origin.
// Reads NEXT_PUBLIC_SITE_URL (set in Vercel) with fallbacks for preview
// and local dev. Used by sitemap.ts and robots.ts so every deployment
// advertises its own origin, not a hardcoded string.
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://mangaspace-eight.vercel.app";
}
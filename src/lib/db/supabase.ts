import { type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let cached: SupabaseClient | null | undefined;

// Browser client. @supabase/ssr persists the session — and the OAuth/magic-link
// PKCE verifier — in cookies instead of localStorage, so the /auth/callback
// route can read them server-side and re-establish the session. This is what
// makes OAuth and magic-link login work; a localStorage-only client cannot.
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    cached = null;
    return null;
  }
  try {
    cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch {
    cached = null;
  }
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

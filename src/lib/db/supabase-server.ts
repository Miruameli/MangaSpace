import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase";

// Server client for route handlers. Reads and writes the auth session through
// Next's request-scoped cookie store, so /auth/callback can both read the PKCE
// verifier and persist the session (Set-Cookie) on the return trip.
//
// Create a fresh client per request — never share one across requests.
export async function getSupabaseServer(): Promise<SupabaseClient> {
  const store = await cookies();

  const getAll: CookieMethodsServer["getAll"] = () =>
    store.getAll().map((c) => ({ name: c.name, value: c.value }));

  const setAll: CookieMethodsServer["setAll"] = (cookiesToSet) => {
    for (const { name, value, options } of cookiesToSet) {
      store.set(name, value, options);
    }
  };

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: { encode: "user-and-tokens", getAll, setAll },
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/db/supabase";

// Deletes the caller's own account. Supabase sessions live in cookies now, but
// the caller also sends its access token explicitly; we verify it against the
// auth server so only the real account owner can delete themselves. A strict
// same-origin Origin check (fail-closed) is defense in depth against CSRF.
export async function POST(request: Request) {
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }

  // Verify the caller's access token; only the authenticated user may proceed.
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const anon = createClient(url, key);
  const {
    data: { user },
    error,
  } = token ? await anon.auth.getUser(token) : await anon.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const service = createClient(url, serviceKey);
    // Erase all user-owned data BEFORE removing the auth account. These tables
    // have no FK to auth.users, so deleteUser() would orphan them forever.
    await service.from("reading_progress").delete().eq("user_id", user.id);
    await service.from("bookmarks").delete().eq("user_id", user.id);
    await service.auth.admin.deleteUser(user.id);
  } catch {
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

function isSameOrigin(request: Request): boolean {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) return false;
  try {
    return new URL(request.url).origin === new URL(requestOrigin).origin;
  } catch {
    return false;
  }
}

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { safeNext } from "@/lib/auth/redirect";

// Handles the return trip for OAuth and email magic-link flows. Supabase
// redirects back here with an authorization code; we exchange it for a session
// (reading the PKCE verifier and persisting the session via cookies) and send
// the user on. `next` is sanitized to a same-origin path only.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(redirectTo, request.url), { status: 302 });
  }

  const supabase = await getSupabaseServer();
  try {
    await supabase.auth.exchangeCodeForSession(code);
  } catch {
    // Invalid/expired code — send the user to sign in with a generic note.
    return NextResponse.redirect(
      new URL("/login?error=auth_callback", request.url),
      { status: 302 },
    );
  }

  return NextResponse.redirect(new URL(redirectTo, request.url), { status: 302 });
}

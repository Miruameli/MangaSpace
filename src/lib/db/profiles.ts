import { getSupabase } from "./supabase";

// A user profile row. `id` is the Supabase auth user id.
export interface Profile {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  updatedAt: string | null;
}

export const MAX_DISPLAY_NAME = 60;

// Whitelist validation for the display name (length + basic sanitization).
export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Display name can't be empty.";
  if (trimmed.length > MAX_DISPLAY_NAME)
    return `Display name must be ${MAX_DISPLAY_NAME} characters or fewer.`;
  return null;
}

// Basic absolute-URL check for an avatar link.
export function isValidAvatarUrl(value: string): boolean {
  if (!value.trim()) return true; // empty is allowed (clears the avatar)
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    email: (row.email as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
  };
}

// Read the current user's profile. Returns null when Supabase is off or missing.
export async function getProfile(userId: string): Promise<Profile | null> {
  const sb = getSupabase();
  if (!sb || !userId) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfile(data as Record<string, unknown>);
}

// Update the owner's profile row. Returns an error message or null on success.
export async function updateProfile(
  userId: string,
  attrs: { displayName?: string; avatarUrl?: string },
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb || !userId) return "Supabase is not configured.";

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (attrs.displayName !== undefined) patch.display_name = attrs.displayName.trim();
  if (attrs.avatarUrl !== undefined) patch.avatar_url = attrs.avatarUrl.trim() || null;

  const { error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  return error?.message ?? null;
}

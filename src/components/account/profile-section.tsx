"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { validateDisplayName, isValidAvatarUrl } from "@/lib/db/profiles";

const card =
  "rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-3";
const inputCls =
  "w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2";

export function ProfileSection() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [avatar, setAvatar] = useState(profile?.avatarUrl ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (validateDisplayName(name)) return;
    if (avatar && !isValidAvatarUrl(avatar)) return;
    setBusy(true);
    setMsg(null);
    const err = await updateProfile({ displayName: name, avatarUrl: avatar });
    if (err) {
      setMsg(err);
      setBusy(false);
      return;
    }
    await refreshProfile();
    setBusy(false);
    setMsg("Profile updated.");
  }

  const email = profile?.email ?? user?.email ?? "";
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className={card}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Profile
      </h2>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-semibold">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{name || "No display name"}</p>
          <p className="truncate text-sm text-zinc-500">{email}</p>
        </div>
      </div>
      <form onSubmit={save} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input
            type="text"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Avatar URL <span className="text-zinc-400">(optional)</span>
          <input
            type="url"
            value={avatar}
            placeholder="https://…"
            onChange={(e) => setAvatar(e.target.value)}
            className={inputCls}
          />
        </label>
        {msg && <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">{msg}</p>}
        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}

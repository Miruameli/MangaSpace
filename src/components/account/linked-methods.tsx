"use client";

import { useAuth } from "@/components/auth/auth-provider";

const LABELS: Record<string, string> = {
  email: "Email & password",
  google: "Google",
  github: "GitHub",
  apple: "Apple",
};

export function LinkedMethods() {
  const { identities } = useAuth();
  // identities is populated by Supabase for every provider (email + any OAuth).
  const methods = Array.from(new Set(identities.map((i) => i.provider)));

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Sign-in methods
      </h2>
      {methods.length === 0 ? (
        <p className="text-sm text-zinc-500">No linked methods yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {methods.map((p) => (
            <li
              key={p}
              className="flex items-center justify-between text-sm"
            >
              <span className="font-medium">{LABELS[p] ?? p}</span>
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 text-xs text-zinc-500 capitalize">
                {p}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-zinc-400">
        Add or remove OAuth providers in the Supabase dashboard.
      </p>
    </div>
  );
}

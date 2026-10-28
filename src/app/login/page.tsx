"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export default function LoginPage() {
  const { signIn, signUp, configured, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-2">Sign in</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable accounts.
        </p>
      </div>
    );
  }

  if (user) {
    router.replace("/");
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn = mode === "signin" ? signIn : signUp;
    const err = await fn(email, password);
    setBusy(false);
    if (err) setError(err);
    else router.replace("/");
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

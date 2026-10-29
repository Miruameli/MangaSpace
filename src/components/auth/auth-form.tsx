"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { useAuth } from "./auth-provider";
import { OAuthButtons } from "./oauth-buttons";

type Mode = "signin" | "signup";

const inputCls =
  "w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2";
const submitCls =
  "rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 disabled:opacity-50";

export function AuthForm() {
  const { signIn, signUp, sendMagicLink, signInWithOAuth } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await (mode === "signin" ? signIn : signUp)(email, password);
    setBusy(false);
    if (err) setError(err);
    else router.replace("/");
  }

  async function sendMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await sendMagicLink(email);
    setBusy(false);
    if (err) setError(err);
    else setMagicSent(true);
  }

  async function chooseOAuth(provider: Provider) {
    setBusy(true);
    setError(null);
    const err = await signInWithOAuth(provider);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("signin")}
          aria-pressed={mode === "signin"}
          className={`px-1 pb-1 border-b-2 ${
            mode === "signin"
              ? "border-zinc-900 dark:border-zinc-100"
              : "border-transparent text-zinc-500"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          aria-pressed={mode === "signup"}
          className={`px-1 pb-1 border-b-2 ${
            mode === "signup"
              ? "border-zinc-900 dark:border-zinc-100"
              : "border-transparent text-zinc-500"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputCls}
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={inputCls}
        />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className={submitCls}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-xs uppercase tracking-wide text-zinc-400">or</p>

      {magicSent ? (
        <p className="text-sm text-zinc-500" role="status">
          Check your email for the sign-in link.
        </p>
      ) : (
        <form onSubmit={sendMagic} className="flex flex-col gap-2">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email for a passwordless link"
            className={inputCls}
          />
          <button type="submit" disabled={busy} className={submitCls}>
            {busy ? "Please wait…" : "Send magic link"}
          </button>
        </form>
      )}

      <p className="text-center text-xs uppercase tracking-wide text-zinc-400">or</p>
      <OAuthButtons onChoose={chooseOAuth} busy={busy} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

const card =
  "rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4";
const inputCls =
  "w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2";
const btnCls =
  "self-start rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 disabled:opacity-50";

export function SecuritySection() {
  const { changeEmail, changePassword, deleteAccount } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const [pw, setPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [delMsg, setDelMsg] = useState<string | null>(null);

  async function changeEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailMsg("Enter a valid email address.");
      return;
    }
    setEmailBusy(true);
    setEmailMsg(null);
    const err = await changeEmail(email);
    setEmailBusy(false);
    setEmailMsg(err ?? "Check your email to confirm the new address.");
  }

  async function changePwSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) {
      setPwMsg("Password must be at least 6 characters.");
      return;
    }
    setPwBusy(true);
    setPwMsg(null);
    const err = await changePassword(pw);
    setPwBusy(false);
    setPwMsg(err ?? "Password updated.");
    setPw("");
  }

  async function confirmDelete() {
    if (!confirm("Delete your account and all synced data? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    setDelMsg(null);
    const err = await deleteAccount();
    setDeleting(false);
    if (err) {
      setDelMsg(err);
      return;
    }
    router.replace("/login");
  }

  return (
    <div className={card}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Security
      </h2>

      <form onSubmit={changeEmailSubmit} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Change email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="new@email.com"
            className={inputCls}
          />
        </label>
        {emailMsg && <p className="text-sm text-zinc-600 dark:text-zinc-400">{emailMsg}</p>}
        <button type="submit" disabled={emailBusy} className={btnCls}>
          {emailBusy ? "Sending…" : "Send confirmation"}
        </button>
      </form>

      <form onSubmit={changePwSubmit} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          New password
          <input
            type="password"
            value={pw}
            minLength={6}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••"
            className={inputCls}
          />
        </label>
        {pwMsg && <p className="text-sm text-zinc-600 dark:text-zinc-400">{pwMsg}</p>}
        <button type="submit" disabled={pwBusy} className={btnCls}>
          {pwBusy ? "Updating…" : "Update password"}
        </button>
      </form>

      <div className="flex flex-col gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <button
          type="button"
          onClick={confirmDelete}
          disabled={deleting}
          className="self-start rounded-md border border-red-600 text-red-600 px-4 py-2 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete account"}
        </button>
        {delMsg && <p className="text-sm text-red-600" role="alert">{delMsg}</p>}
      </div>
    </div>
  );
}

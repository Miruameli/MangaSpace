"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  const { configured, user } = useAuth();
  const router = useRouter();

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

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">Sign in</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Free account — sync bookmarks and reading progress across devices.
      </p>
      <AuthForm />
    </div>
  );
}

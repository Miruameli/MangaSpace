"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const { user, configured, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          📚 MangaSpace
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">Library</Link>
          <Link href="/bookmarks" className="hover:underline">Bookmarks</Link>
          {configured && (
            user ? (
              <>
                <Link href="/account" className="hover:underline">
                  Account
                </Link>
                <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-[10rem]">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="hover:underline"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="hover:underline">Sign in</Link>
            )
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

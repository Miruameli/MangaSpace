"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Provider, Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/db/supabase";
import {
  getProfile,
  isValidAvatarUrl,
  updateProfile as updateProfileRow,
  validateDisplayName,
  type Profile,
} from "@/lib/db/profiles";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  identities: { id: string; provider: string }[];
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  sendMagicLink: (email: string) => Promise<string | null>;
  signInWithOAuth: (provider: Provider) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  updateProfile: (attrs: {
    displayName?: string;
    avatarUrl?: string;
  }) => Promise<string | null>;
  changeEmail: (email: string) => Promise<string | null>;
  changePassword: (password: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase();
  const configured = supabase !== null;
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async auth check
      setLoading(false);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Keep the profile in sync with the active user.
  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!mounted) return;
      if (user) setProfile(await getProfile(user.id));
      else setProfile(null);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return "Supabase is not configured.";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return "Supabase is not configured.";
      const { error } = await supabase.auth.signUp({ email, password });
      if (!error) return null;
      // A weak password is actionable — surface it. An already-registered email
      // must not reveal account existence — treat it like a normal signup.
      if (/already exists/i.test(error.message)) {
        return "Check your email for a confirmation link.";
      }
      return error.message;
    },
    [supabase],
  );

  const sendMagicLink = useCallback(
    async (email: string) => {
      if (!supabase) return "Supabase is not configured.";
      const { error } = await supabase.auth.signInWithOtp({ email });
      return error?.message ?? null;
    },
    [supabase],
  );

  const signInWithOAuth = useCallback(
    async (provider: Provider) => {
      if (!supabase) return "Supabase is not configured.";
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return error?.message ?? null;
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile(await getProfile(user.id));
  }, [user]);

  const updateProfile = useCallback(
    async (attrs: { displayName?: string; avatarUrl?: string }) => {
      if (!user) return "Not signed in.";
      if (attrs.displayName !== undefined) {
        const v = validateDisplayName(attrs.displayName);
        if (v) return v;
      }
      if (attrs.avatarUrl !== undefined && !isValidAvatarUrl(attrs.avatarUrl)) {
        return "Avatar URL is invalid.";
      }
      return updateProfileRow(user.id, attrs);
    },
    [user],
  );

  const changeEmail = useCallback(
    async (email: string) => {
      if (!supabase) return "Supabase is not configured.";
      const { error } = await supabase.auth.updateUser({ email });
      return error?.message ?? null;
    },
    [supabase],
  );

  const changePassword = useCallback(
    async (password: string) => {
      if (!supabase) return "Supabase is not configured.";
      const { error } = await supabase.auth.updateUser({ password });
      return error?.message ?? null;
    },
    [supabase],
  );

  const deleteAccount = useCallback(async () => {
    if (!supabase) return "Supabase is not configured.";
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return "Not signed in.";
    const res = await fetch("/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return data.error ?? "Could not delete account.";
    }
    // Clear the local session now that the account no longer exists.
    await supabase.auth.signOut();
    return null;
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const identities = useMemo(
    () => (user?.identities ?? []).map((i) => ({ id: i.id, provider: i.provider })),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      configured,
      identities,
      profile,
      signIn,
      signUp,
      sendMagicLink,
      signInWithOAuth,
      refreshProfile,
      updateProfile,
      changeEmail,
      changePassword,
      deleteAccount,
      signOut,
    }),
    [
      user,
      session,
      loading,
      configured,
      identities,
      profile,
      signIn,
      signUp,
      sendMagicLink,
      signInWithOAuth,
      refreshProfile,
      updateProfile,
      changeEmail,
      changePassword,
      deleteAccount,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

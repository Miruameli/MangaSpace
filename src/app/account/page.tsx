"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileSection } from "@/components/account/profile-section";
import { SecuritySection } from "@/components/account/security-section";
import { LinkedMethods } from "@/components/account/linked-methods";

export default function AccountPage() {
  const { configured, user, loading, profile } = useAuth();
  const router = useRouter();

  if (!configured) {
    router.replace("/");
    return null;
  }
  if (loading) {
    return <p className="max-w-2xl mx-auto">Loading…</p>;
  }
  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold">Account</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile and sign-in methods.
        </p>
      </div>
      <ProfileSection key={profile?.id} />
      <SecuritySection />
      <LinkedMethods />
    </div>
  );
}

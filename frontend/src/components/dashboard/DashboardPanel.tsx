"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactElement } from "react";

import { AuthLink } from "@/components/auth/AuthCard";
import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/lib/api";

interface ProfileRowProps {
  label: string;
  value: string;
}

function ProfileRow({ label, value }: ProfileRowProps): ReactElement {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-40 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}

/**
 * Placeholder dashboard for Phase 1: proves the session works end to end by
 * loading `GET /auth/me`, and gives the register/login redirects somewhere to
 * land. The real dashboard arrives in a later phase.
 */
export function DashboardPanel(): ReactElement {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, getMe } = useAuth();

  useEffect((): void => {
    if (isLoading || isAuthenticated) {
      return;
    }

    if (getAuthToken() === null) {
      router.replace("/login");
      return;
    }

    // A token is present but no profile is cached — the common case right after
    // registration. Load it before deciding whether to bounce to the login page.
    void getMe().catch((): void => {
      router.replace("/login");
    });
  }, [getMe, isAuthenticated, isLoading, router]);

  const handleLogout = (): void => {
    logout();
    router.replace("/login");
  };

  if (isLoading || user === null) {
    return <p className="text-sm text-slate-600">Loading your account…</p>;
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Welcome, {user.fullName}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        You are signed in. This is a placeholder dashboard for Phase 1.
      </p>

      <dl className="mt-6">
        <ProfileRow label="Email" value={user.email} />
        <ProfileRow label="Username" value={user.username} />
        <ProfileRow label="Role" value={user.role} />
        <ProfileRow label="Phone" value={user.phone ?? "Not provided"} />
      </dl>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Log out
        </button>

        <AuthLink href="/">Back to the home page</AuthLink>
      </div>
    </div>
  );
}

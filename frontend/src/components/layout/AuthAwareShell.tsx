"use client";

import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { FOCUS_RING } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { loginReturnHref } from "@/lib/memberGate";

export interface AuthAwareShellProps {
  children: ReactNode;
  /** Rendered as the page `h1` by `PageShell`. */
  title?: string;
  /** Supporting line rendered under `title`. */
  description?: string;
  /** Passed through to `PageShell`; `false` lets a page manage its own layout. */
  contained?: boolean;
  /**
   * When `true`, children render only for a signed-in session: a skeleton is
   * shown while the session is being restored and a log-in prompt once it has
   * settled signed-out. Protected content is therefore never flashed.
   */
  requireAuth?: boolean;
  /**
   * Where a signed-out visitor should be returned after logging in. Omitted by
   * pages whose only answer is the login screen itself; set by pages that were
   * reached from an action, so the M1.5 `?next=` flow is not broken by an
   * interrupted navigation.
   */
  returnTo?: string;
}

/**
 * Client boundary that pairs `PageShell` with the hydrated session.
 *
 * Auth state is read from `AuthProvider` (`useAuth`), whose session lives in
 * httpOnly cookies and is verified against `GET /auth/me` on mount. Reading a
 * second, unverified copy of the flag here would let the header claim a session
 * the rest of the app considers expired. `Header` consumes the same context, so
 * its Log in/Register and Dashboard states always agree.
 */
export function AuthAwareShell(props: AuthAwareShellProps): ReactElement {
  const { children, title, description, contained, requireAuth = false, returnTo } = props;
  const { isAuthenticated, isLoading } = useAuth();

  let content: ReactNode = children;

  if (requireAuth) {
    if (isLoading) {
      content = (
        <section
          aria-label="กำลังโหลดเซสชันของคุณ"
          className="rounded-2xl border border-ink-200 bg-white p-8 shadow-card"
        >
          <div aria-hidden="true" className="h-7 w-2/3 animate-pulse rounded bg-ink-100" />
          <div aria-hidden="true" className="mt-4 h-4 w-full animate-pulse rounded bg-ink-100" />
          <div aria-hidden="true" className="mt-2 h-4 w-3/4 animate-pulse rounded bg-ink-100" />
        </section>
      );
    } else if (!isAuthenticated) {
      content = (
        <section className="rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-card">
          <h2 className="text-heading-3 text-ink-900">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</h2>
          <p className="mt-2 text-body-sm text-ink-600">
            หน้านี้สำหรับสมาชิกที่เข้าสู่ระบบแล้วของ FityatulHaq
          </p>

          <Link
            href={returnTo === undefined ? "/login" : loginReturnHref(returnTo)}
            className={`mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-2.5 text-body-sm font-semibold text-white transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-500 ${FOCUS_RING}`}
          >
            เข้าสู่ระบบ
          </Link>
        </section>
      );
    }
  }

  return (
    <PageShell title={title} description={description} contained={contained}>
      {content}
    </PageShell>
  );
}

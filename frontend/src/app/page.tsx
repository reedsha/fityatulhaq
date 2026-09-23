import type { Metadata } from "next";
import type { ReactElement } from "react";

import { DashboardPanel } from "@/components/home/DashboardPanel";
import { AuthAwareShell } from "@/components/layout/AuthAwareShell";

export const metadata: Metadata = {
  title: "FityatulHaq",
  description: "Portal Komunitas dan Informasi Publik FityatulHaq.",
};

/**
 * `/` — the reference-design landing page, promoted from `/dashboard` when the
 * two routes were unified.
 *
 * `AuthAwareShell` composites the same global `Header` / `Footer` every other
 * page uses; `contained={false}` lets the panel's full-bleed dark sections
 * reach the viewport edges. The panel renders content sections only — its
 * former inline navbar and footer were removed in favour of this shell.
 *
 * Auth handling is unchanged from the dashboard days: the panel restores the
 * session via `getMe` and redirects to `/login` when no session exists, so the
 * site root is a signed-in destination rather than a public page.
 */
export default function Home(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <DashboardPanel />
    </AuthAwareShell>
  );
}

import type { Metadata } from "next";
import type { ReactElement } from "react";

import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { AuthAwareShell } from "@/components/layout/AuthAwareShell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your FityatulHaq account overview.",
};

/**
 * `/dashboard` — Full reference-design landing page after a successful sign-in.
 *
 * `AuthAwareShell` composites the same global `Header` / `Footer` every other
 * page uses; `contained={false}` lets the dashboard's full-bleed dark sections
 * reach the viewport edges. `DashboardPanel` renders content sections only —
 * its former inline navbar and footer were removed in favour of this shell.
 * Auth handling is unchanged: the panel restores the session via `getMe` and
 * redirects to `/login` when no session exists.
 */
export default function DashboardPage(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <DashboardPanel />
    </AuthAwareShell>
  );
}

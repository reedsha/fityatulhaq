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
 * The root is PUBLIC per PRD §5.1.1: guests browse every section and are
 * greeted with the register/login CTAs in the hero (ร่วมเป็นสมาชิก ·
 * เข้าสู่ระบบ), while signed-in members see their name once the session
 * resolves. Only member-only actions elsewhere in the app redirect to
 * `/login` (§6.4).
 */
export default function Home(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <DashboardPanel />
    </AuthAwareShell>
  );
}

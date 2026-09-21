import type { Metadata } from "next";
import type { ReactElement } from "react";

import { DashboardPanel } from "@/components/dashboard/DashboardPanel";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your FityatulHaq account overview.",
};

/** `/dashboard` — Phase 1 placeholder landing page after a successful sign-in. */
export default function DashboardPage(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <main className="flex w-full max-w-lg flex-col items-center">
        <DashboardPanel />
      </main>
    </div>
  );
}

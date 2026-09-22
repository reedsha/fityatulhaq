import type { Metadata } from "next";
import type { ReactElement } from "react";

import { ProfilePage } from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Your Profile",
  description: "Manage your FityatulHaq photo and personal details.",
};

/**
 * `/profile` shell. A thin server component so the metadata above stays
 * server-rendered; everything interactive lives in `ProfilePage`, which reads
 * the session from `AuthProvider`.
 */
export default function ProfilePageShell(): ReactElement {
  return <ProfilePage />;
}

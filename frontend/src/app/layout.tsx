import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME ?? "FityatulHaq",
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME ?? "FityatulHaq"}`,
  },
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
};

/**
 * Root layout — minimal placeholder. Phase 1 will expand this with the
 * sticky Header + Footer shell per SRS Sections 3 & 4.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
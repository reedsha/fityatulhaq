import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactElement, ReactNode } from "react";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";

import "../globals.css";

/**
 * Brand face, self-hosted via `next/font/local` — no external font requests.
 * The CSS variable is wired into `designTokens.fontFamily.sans`, which the
 * Tailwind `sans` stack consumes, so every element inherits Kanit through the
 * token. Weights 400–800 are real files; the class goes on `<html>` because
 * preflight applies the font stack there.
 */
const kanit = localFont({
  src: [
    { path: "../fonts/Kanit-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Kanit-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Kanit-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Kanit-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/Kanit-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME ?? "FityatulHaq",
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME ?? "FityatulHaq"}`,
  },
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
};

/**
 * Root layout.
 *
 * `AuthProvider` is a client component, so mounting it here makes the session
 * available to every client component in the tree while the page shells below it
 * stay server-rendered. `Toaster` renders the toast host used by the auth forms.
 *
 * Phase 1 COMPLETE: AuthProvider + toast infrastructure active.
 */
export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    // `suppressHydrationWarning` keeps browser extensions (e.g. QuillBot's
    // `data-qb-installed` attribute on <html>) from producing harmless attribute
    // mismatch warnings during hydration. It applies to this element's
    // attributes only — children are still strictly checked.
    <html lang="th" className={kanit.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-ink-50 text-ink-900 antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
        </AuthProvider>
      </body>
    </html>
  );
}

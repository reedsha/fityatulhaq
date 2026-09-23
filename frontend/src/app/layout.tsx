import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";

import "../globals.css";

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
    <html lang="th">
      <body className="min-h-screen bg-ink-50 text-ink-900 antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { ReactElement, ReactNode } from "react";

export interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Shell for every authentication screen: centres the card on all viewports and
 * keeps the padding responsive down to small phones.
 */
export default function AuthLayout({ children }: AuthLayoutProps): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <main className="flex w-full max-w-md flex-col items-center">{children}</main>
    </div>
  );
}

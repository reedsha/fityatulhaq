import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  /** Rendered above the title — used for form-level errors. */
  banner?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centred card shared by every auth screen. */
export function AuthCard(props: AuthCardProps): ReactElement {
  const { title, subtitle, banner, children, footer } = props;

  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {banner}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {subtitle !== undefined ? (
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      ) : null}
      <div className="mt-6">{children}</div>
      {footer !== undefined ? (
        <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600">{footer}</div>
      ) : null}
    </section>
  );
}

export interface AuthLinkProps {
  href: string;
  children: ReactNode;
}

export function AuthLink({ href, children }: AuthLinkProps): ReactElement {
  return (
    <Link
      href={href}
      className="font-medium text-emerald-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-300"
    >
      {children}
    </Link>
  );
}

export interface FormBannerProps {
  message: string;
}

/** Form-level error, announced immediately to assistive technology. */
export function FormBanner({ message }: FormBannerProps): ReactElement {
  return (
    <div
      role="alert"
      className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </div>
  );
}

export interface FormSuccessProps {
  message: string;
}

/** Form-level confirmation. */
export function FormSuccess({ message }: FormSuccessProps): ReactElement {
  return (
    <div
      role="status"
      className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
    >
      {message}
    </div>
  );
}

/**
 * Placeholder card shown while a page hydrates its query parameters. Mirrors the
 * `AuthCard` shell so the layout does not jump when the real form arrives.
 */
export function AuthCardFallback(): ReactElement {
  return (
    <section
      aria-hidden="true"
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="h-7 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-8 space-y-4">
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
      </div>
      <span className="sr-only">Loading form</span>
    </section>
  );
}

"use client";

import { ArrowRight } from "lucide-react";
import type { ReactElement } from "react";

export interface RegisterCTAProps {
  isLoggedIn: boolean;
}

/**
 * Registration call to action.
 *
 * Signed-in visitors get a quiet pointer to their profile instead of a sales
 * pitch; asking someone who already has an account to create one is noise.
 */
export function RegisterCTA({ isLoggedIn }: RegisterCTAProps): ReactElement {
  if (isLoggedIn) {
    return (
      <section
        aria-label="Your account"
        className="w-full border-y border-ink-200 bg-white py-12"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-center sm:px-6">
          <p className="text-heading-4 text-ink-900">
            Welcome back! Your profile is ready.
          </p>

          <a
            href="/profile"
            className="inline-flex items-center gap-1 text-body-sm font-semibold text-brand-700 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Manage your account
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Join FityatulHaq"
      className="relative isolate w-full overflow-hidden bg-brand-800 py-16"
    >
      {/* Diagonal texture, kept faint so the copy stays WCAG-compliant over it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 12px)",
        }}
      />

      {/* Decorative geometry, hidden from assistive technology and clipped by
          the section so it never creates horizontal scroll. */}
      <div
        aria-hidden="true"
        className="absolute -left-16 -top-16 -z-10 h-56 w-56 rounded-full border-[12px] border-white/10"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -right-10 -z-10 h-64 w-64 rounded-full border-[16px] border-white/10"
      />

      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <h2 className="text-heading-2 tracking-tight text-white md:text-heading-1">
          Join the FityatulHaq Community
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-body text-brand-50">
          Register to access exclusive resources, forums, and member-only content.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/register"
            className="w-full rounded-lg bg-white px-8 py-3 text-heading-4 text-brand-800 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800 sm:w-auto"
          >
            Create an account
          </a>

          <a
            href="/about"
            className="w-full rounded-lg border border-white/70 px-8 py-3 text-heading-4 text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800 sm:w-auto"
          >
            Learn more about us
          </a>
        </div>
      </div>
    </section>
  );
}

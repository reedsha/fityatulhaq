"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { HandHelping, HeartHandshake, Sparkles, Users } from "lucide-react";
import type { ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";
import { PROGRAMMES } from "@/lib/communityData";

/* ====================================================================
   COMMUNITY — /community
   ====================================================================

   Visual language: the shared page frame — dark band header, white
   `shadow-card` cards on the `#0c1017` band, lime accents.

   Programme cards are deliberately NON-interactive `<article>` elements:
   no detail routes exist yet, so there are no hrefs, no buttons and no
   hover-pointer. The icon strings from the data module map through a
   typed Record to imported lucide components — no dynamic imports.
   ==================================================================== */

// ---------------------------------------------------------------
// Icon mapping — data carries the lucide icon NAME as a string
// ---------------------------------------------------------------

const PROGRAMME_ICONS: Record<string, LucideIcon> = {
  HeartHandshake,
  Users,
  Sparkles,
  HandHelping,
};

const FALLBACK_ICON: LucideIcon = Users;

// ---------------------------------------------------------------
// Programme card (non-interactive)
// ---------------------------------------------------------------

function ProgrammeCard({ programme }: { programme: (typeof PROGRAMMES)[number] }): ReactElement {
  const Icon = PROGRAMME_ICONS[programme.icon] ?? FALLBACK_ICON;

  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-heading-4 text-ink-900">{programme.name}</h3>
      <p className="mt-1 text-body-sm font-bold text-brand-700">{programme.tagline}</p>
      <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{programme.description}</p>
    </article>
  );
}

// ---------------------------------------------------------------
// Getting-involved steps
// ---------------------------------------------------------------

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: "Create an account",
    body: "Register with your email and confirm the one-time code — it takes about two minutes.",
  },
  {
    title: "Pick a programme",
    body: "Choose the circle that fits your family, your interests or the time you can give.",
  },
  {
    title: "Show up",
    body: "Come along, bring a friend, and grow with us — every branch has open doors.",
  },
];

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function CommunityPage(): ReactElement {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0c1017]">
      {/* ── Header band ──────────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
        />

        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-caption text-ink-400">
            <Link
              href="/"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              Home
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-ink-200">
              Community
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Community
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            Four programmes, one community — find the circle where you belong.
          </p>
        </div>
      </header>

      {/* ── Programme cards (non-interactive) ────────────────────────── */}
      <section aria-label="Our programmes" className="px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-heading-3 text-white">Our programmes</h2>
          <ul className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMMES.map((programme) => (
              <li key={programme.id}>
                <ProgrammeCard programme={programme} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How to get involved ──────────────────────────────────────── */}
      <section aria-label="How to get involved" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-heading-3 text-white">How to get involved</h2>
          <ol className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-card">
                  {/* Big lime step number */}
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-300 text-2xl font-extrabold text-brand-950"
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-heading-4 text-ink-900">{step.title}</h3>
                  <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{step.body}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────────── */}
      <section
        aria-label="Join us"
        className="mt-12 flex-1 bg-accent-300 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-heading-3 text-ink-900">Ready to join?</h2>
          <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-brand-950/80">
            Membership is free for school-age members, and every programme is open to
            registered families.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className={`inline-flex items-center justify-center rounded-full bg-brand-950 px-6 py-2.5 text-caption font-bold text-accent-300 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-800 ${FOCUS_RING}`}
            >
              Become a member
            </Link>
            <Link
              href="/contact"
              className={`inline-flex items-center justify-center rounded-full border border-brand-950/40 px-6 py-2.5 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-950/10 ${FOCUS_RING}`}
            >
              Talk to us first
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

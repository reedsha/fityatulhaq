"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";

/* ====================================================================
   COMMITTEE — /about/committee
   ====================================================================

   Visual language: the shared page frame — dark band header, member cards
   as white `shadow-card` cards on the `#0c1017` band. Avatars are CSS
   placeholder circles with the member's initial; no photos are referenced
   anywhere, per the project decision. Circle backgrounds rotate through
   brand shades dark enough to keep the white initial WCAG-readable
   (lime or pale circles would fail contrast with white text).

   Site chrome (header, skip link, footer) is supplied by the route shell
   in `app/about/committee/page.tsx` via `AuthAwareShell`; this file
   renders content only, so it must not introduce a second `<main>`.
   ==================================================================== */

interface CommitteeMember {
  name: string;
  role: string;
  responsibility: string;
}

const COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    name: "Ahmad Fauzi",
    role: "Chairperson",
    responsibility: "Leads the committee and chairs the annual general meeting.",
  },
  {
    name: "Nurul Hidayah",
    role: "Vice-Chairperson",
    responsibility: "Deputises for the chair and oversees programme delivery.",
  },
  {
    name: "Yusuf Abdullah",
    role: "Secretary",
    responsibility: "Keeps the minutes, records and official correspondence.",
  },
  {
    name: "Maryam Salleh",
    role: "Treasurer",
    responsibility: "Manages budgets, accounts and the annual audit.",
  },
  {
    name: "Ibrahim Musa",
    role: "Youth Representative",
    responsibility: "Represents the member branches and youth programmes.",
  },
  {
    name: "Aisha Rahman",
    role: "Women's Affairs Representative",
    responsibility: "Liaises with the women's office and its programmes.",
  },
];

/** Brand shades dark enough for a white initial (WCAG AA on all three). */
const AVATAR_BACKGROUNDS = ["bg-brand-600", "bg-brand-700", "bg-brand-800"] as const;

function MemberCard({ member, index }: { member: CommitteeMember; index: number }): ReactElement {
  const circleClass = AVATAR_BACKGROUNDS[index % AVATAR_BACKGROUNDS.length] ?? "bg-brand-600";

  return (
    <article className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-card">
      {/* Placeholder avatar — initial only, no photo. */}
      <div
        aria-hidden="true"
        className={`flex h-20 w-20 items-center justify-center rounded-full ${circleClass}`}
      >
        <span className="text-2xl font-extrabold text-white">
          {member.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <h2 className="mt-4 text-heading-4 text-ink-900">{member.name}</h2>
      <p className="mt-1 text-caption font-semibold uppercase tracking-wider text-ink-500">
        {member.role}
      </p>
      <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{member.responsibility}</p>
    </article>
  );
}

export default function CommitteePage(): ReactElement {
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
          {/* Breadcrumb */}
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
            <Link
              href="/about"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              About
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-ink-200">
              Committee
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Our Committee
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            The members elected to govern FityatulHaq for the current term.
          </p>
        </div>
      </header>

      {/* ── Member grid ──────────────────────────────────────────────── */}
      <section aria-label="Committee members" className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COMMITTEE_MEMBERS.map((member, index) => (
              <li key={member.name}>
                <MemberCard member={member} index={index} />
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-caption text-ink-400">
            The committee is elected at the annual general meeting for a two-year term.
          </p>

          <nav aria-label="Back to about" className="mt-6 text-center">
            <Link
              href="/about"
              className={`inline-flex items-center gap-1 rounded-sm text-caption font-medium text-brand-300 transition duration-fast ease-standard motion-reduce:transition-none hover:text-accent-300 ${FOCUS_RING_DARK}`}
            >
              ← Back to About
            </Link>
          </nav>
        </div>
      </section>
    </div>
  );
}

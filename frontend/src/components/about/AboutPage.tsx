"use client";

import Link from "next/link";
import {
  BookOpen,
  Eye,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";

/* ====================================================================
   ABOUT — /about
   ====================================================================

   Visual language: the /news and /announcements page frame — dark band
   header (`bg-brand-950` + gradient), content on the `#0c1017` band with
   white `shadow-card` cards, lime `bg-accent-300` pills, ink-* text
   tokens — so About reads as part of the same site as the dashboard.

   Site chrome (header, skip link, footer) is supplied by the route shell
   in `app/about/page.tsx` via `AuthAwareShell`; this file renders content
   only, so it must not introduce a second `<main>`.
   ==================================================================== */

// ---------------------------------------------------------------
// Mission & vision cards
// ---------------------------------------------------------------

interface StatementCardProps {
  icon: LucideIcon;
  title: string;
  body: string;
}

function StatementCard(props: StatementCardProps): ReactElement {
  const { icon: Icon, title, body } = props;

  return (
    <article className="flex flex-col rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <span
        aria-hidden="true"
        className="h-1 w-10 rounded-full bg-accent-300"
      />
      <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-300/15 text-brand-700">
        <Icon aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-heading-4 text-ink-900">{title}</h2>
      <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{body}</p>
    </article>
  );
}

// ---------------------------------------------------------------
// "What we do" pillar cards — dashboard category-card rotation
// ---------------------------------------------------------------

type PillarTone = "lime" | "pale" | "white";

const PILLAR_TONE_CLASSES: Record<PillarTone, { card: string; title: string; body: string }> = {
  lime: {
    card: "bg-accent-300",
    title: "text-ink-900",
    body: "text-brand-950/80",
  },
  pale: {
    card: "bg-brand-50",
    title: "text-brand-800",
    body: "text-brand-700",
  },
  white: {
    card: "bg-white",
    title: "text-ink-900",
    body: "text-ink-600",
  },
};

interface Pillar {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: PillarTone;
}

const PILLARS: Pillar[] = [
  {
    icon: GraduationCap,
    title: "Youth Development",
    description: "Mentoring, camps and leadership training for members aged 11 to 25.",
    tone: "lime",
  },
  {
    icon: BookOpen,
    title: "Education & Knowledge",
    description: "Study clubs, a digital library and an encyclopaedia open to all members.",
    tone: "pale",
  },
  {
    icon: HeartHandshake,
    title: "Community Service",
    description: "Volunteer projects that put members to work for the neighbourhoods around them.",
    tone: "white",
  },
  {
    icon: Megaphone,
    title: "Communication & Outreach",
    description: "News, official announcements and a webboard that keep the network connected.",
    tone: "pale",
  },
];

function PillarCard({ pillar }: { pillar: Pillar }): ReactElement {
  const Icon = pillar.icon;
  const tone = PILLAR_TONE_CLASSES[pillar.tone];

  return (
    <article className={`flex flex-col rounded-2xl p-5 shadow-card ${tone.card}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded bg-ink-950/10">
        <Icon aria-hidden="true" strokeWidth={1.75} className={`h-5 w-5 ${tone.title}`} />
      </div>
      <h3 className={`mt-3 text-heading-4 ${tone.title}`}>{pillar.title}</h3>
      <p className={`mt-2 text-body-sm leading-relaxed ${tone.body}`}>{pillar.description}</p>
    </article>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function AboutPage(): ReactElement {
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
            <span aria-current="page" className="text-ink-200">
              About
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            About Us
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            A youth development organisation supporting young people through learning,
            community and service.
          </p>
        </div>
      </header>

      {/* ── Mission & Vision ─────────────────────────────────────────── */}
      <section aria-label="Mission and vision" className="px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
          <StatementCard
            icon={Target}
            title="Our Mission"
            body="To nurture disciplined, knowledgeable and service-minded young people — equipping every member with the character, skills and opportunities to lead in their community."
          />
          <StatementCard
            icon={Eye}
            title="Our Vision"
            body="A generation of graduates who stand for good: confident in their identity, generous in service, and recognised as a positive force in society."
          />
        </div>
      </section>

      {/* ── Our History ──────────────────────────────────────────────── */}
      <section aria-label="Our history" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-heading-3 text-white">Our History</h2>

          {/* Opening statement carries the lime accent bar. */}
          <p className="mt-5 border-l-4 border-accent-300 pl-6 text-lg leading-relaxed text-ink-100">
            FityatulHaq began in 2011 as a small weekend study circle run by volunteer
            teachers, meeting in a borrowed classroom with fifteen students.
          </p>

          <p className="mt-5 text-body leading-relaxed text-ink-300">
            Within three years the circle had grown into a registered youth association with
            branches in four provinces, and the first summer camp brought two hundred young
            people together for a week of study, sport and service.
          </p>
          <p className="mt-4 text-body leading-relaxed text-ink-300">
            Today the organisation operates the mentoring programme, the digital library and
            the community service projects that members know — still volunteer-run at heart,
            and still governed by a committee elected at the annual general meeting.
          </p>
          <p className="mt-4 text-body leading-relaxed text-ink-300">
            Fifteen years on, our purpose has not moved: to raise a generation that stands
            for good, and to give every young person who joins us a place to learn, grow and
            serve together.
          </p>
        </div>
      </section>

      {/* ── What We Do ───────────────────────────────────────────────── */}
      <section aria-label="What we do" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-heading-3 text-white">What We Do</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar) => (
              <PillarCard key={pillar.title} pillar={pillar} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership CTA ───────────────────────────────────────────── */}
      <section
        aria-label="Meet the committee"
        className="relative isolate mt-12 overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
        />

        <div className="relative mx-auto max-w-6xl text-center">
          <h2 className="text-heading-3 text-white">Our Leadership</h2>
          <p className="mx-auto mt-2 max-w-xl text-body text-ink-300">
            The committee is elected by the membership at the annual general meeting and
            serves a two-year term.
          </p>
          <Link
            href="/about/committee"
            className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-6 py-2.5 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING_DARK}`}
          >
            Meet the committee
          </Link>
        </div>
      </section>
    </div>
  );
}

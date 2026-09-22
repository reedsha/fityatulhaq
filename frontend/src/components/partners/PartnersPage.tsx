"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMemo, type ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";
import { PARTNERS, type Partner } from "@/lib/partnerData";

/* ====================================================================
   PARTNERS — /partners
   ====================================================================

   Visual language: the shared page frame — dark band header, white
   `shadow-card` tiles on the `#0c1017` band, lime accents. Logos are
   initials placeholders only: no <img> tags, no image files.

   Every tile is a real external link in a new tab.
   ==================================================================== */

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// ---------------------------------------------------------------
// Partner tile
// ---------------------------------------------------------------

function PartnerTile({ partner }: { partner: Partner }): ReactElement {
  return (
    <li>
      <a
        href={partner.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${partner.name} — opens in a new tab`}
        className={`group relative flex h-full flex-col rounded-2xl bg-white p-5 shadow-card transition duration-fast ease-standard motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:hover:translate-y-0 ${FOCUS_RING}`}
      >
        <ArrowUpRight
          aria-hidden="true"
          strokeWidth={1.75}
          className="absolute right-4 top-4 h-4 w-4 text-ink-400 transition duration-fast ease-standard group-hover:text-brand-600 motion-reduce:transition-none"
        />

        <div
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50"
        >
          <span className="text-xl font-extrabold text-brand-700">
            {initialsOf(partner.name)}
          </span>
        </div>

        <h3 className="mt-4 text-body font-bold text-ink-900 group-hover:text-brand-700">
          {partner.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-caption leading-relaxed text-ink-500">
          {partner.description}
        </p>
      </a>
    </li>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function PartnersPage(): ReactElement {
  // Categories in first-seen order across the data array.
  const categories = useMemo((): string[] => {
    const seen = new Set<string>();
    for (const partner of PARTNERS) {
      seen.add(partner.category);
    }
    return Array.from(seen);
  }, []);

  const grouped = useMemo((): Map<string, Partner[]> => {
    const map = new Map<string, Partner[]>();
    for (const partner of PARTNERS) {
      const list = map.get(partner.category);
      if (list === undefined) {
        map.set(partner.category, [partner]);
      } else {
        list.push(partner);
      }
    }
    return map;
  }, []);

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
              Partners
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            Our Partners
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            Schools, community organisations and youth networks we work alongside to reach
            more young people.
          </p>
        </div>
      </header>

      {/* ── Category sections ────────────────────────────────────────── */}
      {categories.map((category) => (
        <section
          key={category}
          aria-label={`${category} partners`}
          className="px-4 pt-12 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <span aria-hidden="true" className="block h-1 w-10 rounded-full bg-accent-300" />
            <h2 className="mt-3 text-heading-3 text-white">{category}</h2>

            <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {(grouped.get(category) ?? []).map((partner) => (
                <PartnerTile key={partner.id} partner={partner} />
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* ── Become a partner CTA ─────────────────────────────────────── */}
      <section
        aria-label="Become a partner"
        className="relative isolate mt-12 flex-1 overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 lg:px-8"
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
          <h2 className="text-heading-3 text-white">Become a partner</h2>
          <p className="mx-auto mt-2 max-w-xl text-body text-ink-300">
            If your organisation works with young people, we would love to explore what we
            can build together.
          </p>
          <Link
            href="/contact"
            className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-6 py-2.5 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING_DARK}`}
          >
            Discuss a partnership
          </Link>
        </div>
      </section>
    </div>
  );
}

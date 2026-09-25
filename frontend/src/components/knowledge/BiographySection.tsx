"use client";

import type { ReactElement } from "react";

import { BIOGRAPHIES } from "@/lib/knowledgeItemsData";

/** Brand shades dark enough for a white initial (same set as the committee page). */
const AVATAR_BACKGROUNDS = ["bg-brand-600", "bg-brand-700", "bg-brand-800"] as const;

function BiographyCard({ biography, index }: { biography: (typeof BIOGRAPHIES)[number]; index: number }): ReactElement {
  const circleClass = AVATAR_BACKGROUNDS[index % AVATAR_BACKGROUNDS.length] ?? "bg-brand-600";

  return (
    <article className="flex h-full flex-col items-center rounded-2xl bg-white p-6 text-center shadow-card">
      {/* Placeholder portrait — initials only, no photos. */}
      <div
        aria-hidden="true"
        className={`flex h-20 w-20 items-center justify-center rounded-full ${circleClass}`}
      >
        <span className="text-2xl font-extrabold text-white">{biography.initials}</span>
      </div>

      <h3 className="mt-4 text-heading-4 text-ink-900">{biography.name}</h3>
      <p className="mt-1 text-caption font-semibold uppercase tracking-wider text-ink-500">
        {biography.field}
      </p>
      <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{biography.summary}</p>
    </article>
  );
}

export default function BiographySection(): ReactElement {
  return (
    <section aria-label="Biographies">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {BIOGRAPHIES.map((biography, index) => (
          <li key={biography.id}>
            <BiographyCard biography={biography} index={index} />
          </li>
        ))}
      </ul>
    </section>
  );
}

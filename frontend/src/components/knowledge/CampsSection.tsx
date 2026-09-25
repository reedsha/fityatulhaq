"use client";

import { MapPin, Tent } from "lucide-react";
import type { ReactElement } from "react";

import { CAMPS, type CampItem } from "@/lib/knowledgeItemsData";
import { formatDate } from "@/lib/validation";

function CampRow({ camp }: { camp: CampItem }): ReactElement {
  return (
    <li className="relative pl-10">
      {/* Timeline spine + node */}
      <span
        aria-hidden="true"
        className="absolute left-[11px] top-2 h-full w-px bg-ink-700/60"
      />
      <span
        aria-hidden="true"
        className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent-300"
      >
        <Tent aria-hidden="true" strokeWidth={2} className="h-3.5 w-3.5 text-brand-950" />
      </span>

      <article className="mb-8 rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
            {camp.season} Camp
          </span>
          <span className="text-caption font-medium text-ink-500">
            <time dateTime={camp.startDate}>{formatDate(camp.startDate)}</time>
            {" – "}
            <time dateTime={camp.endDate}>{formatDate(camp.endDate)}</time>
          </span>
        </div>

        <h3 className="mt-3 text-heading-4 text-ink-900">{camp.title}</h3>

        <div className="mt-3 flex items-start gap-6">
          {/* Gradient thumbnail — placeholder, no image files. */}
          <div
            aria-hidden="true"
            className="hidden h-20 w-32 shrink-0 rounded-xl bg-gradient-to-br from-blue-100 to-slate-200 sm:block"
          />
          <div>
            <p className="flex items-center gap-1.5 text-caption font-medium text-ink-500">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {camp.location}
            </p>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{camp.summary}</p>
          </div>
        </div>
      </article>
    </li>
  );
}

export default function CampsSection(): ReactElement {
  return (
    <section aria-label="Camp archive">
      <ul className="max-w-3xl">
        {CAMPS.map((camp) => (
          <CampRow key={camp.id} camp={camp} />
        ))}
      </ul>
    </section>
  );
}

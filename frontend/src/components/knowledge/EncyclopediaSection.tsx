"use client";

import { Library } from "lucide-react";
import type { ReactElement } from "react";

import { ENCYCLOPEDIA_ENTRIES } from "@/lib/knowledgeItemsData";

function EntryCard({ title, summary, tags }: { title: string; summary: string; tags: string[] }): ReactElement {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Library aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-heading-4 text-ink-900">{title}</h3>
      <p className="mt-2 flex-1 text-body-sm leading-relaxed text-ink-600">{summary}</p>

      {/* Display-only tags — filtering arrives with /search (M5). */}
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="แท็ก">
        {tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700"
          >
            {tag}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function EncyclopediaSection(): ReactElement {
  return (
    <section aria-label="สารานุกรม">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ENCYCLOPEDIA_ENTRIES.map((entry) => (
          <li key={entry.id}>
            <EntryCard title={entry.title} summary={entry.summary} tags={entry.tags} />
          </li>
        ))}
      </ul>
    </section>
  );
}

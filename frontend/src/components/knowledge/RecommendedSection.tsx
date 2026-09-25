"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { ReactElement } from "react";

import { FOCUS_RING } from "@/components/layout/Header";
import { RECOMMENDED, type RecommendedItem } from "@/lib/knowledgeItemsData";

/** Type badge colours — token palette only. */
const TYPE_CHIP: Record<RecommendedItem["type"], string> = {
  News: "bg-blue-50 text-blue-700",
  Announcement: "bg-ink-100 text-ink-700",
  Book: "bg-state-success-50 text-state-success-700",
  Video: "bg-tertiary-200 text-tertiary-800",
  Academic: "bg-brand-50 text-brand-700",
};

function RecommendedRow({ item }: { item: RecommendedItem }): ReactElement {
  return (
    <li>
      <Link
        href={item.href}
        className={`group flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-card transition duration-fast ease-standard motion-reduce:transition-none hover:shadow-card-hover ${FOCUS_RING}`}
      >
        <span className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-300 text-brand-950"
          >
            <Star aria-hidden="true" className="h-4 w-4" />
          </span>
          <span>
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${TYPE_CHIP[item.type]}`}
              >
                {item.type}
              </span>
              <span className="text-body font-bold text-ink-900 transition duration-fast ease-standard motion-reduce:transition-none group-hover:text-brand-700">
                {item.title}
              </span>
            </span>
            <span className="mt-1 block text-body-sm leading-relaxed text-ink-600">
              {item.summary}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function RecommendedSection(): ReactElement {
  return (
    <section aria-label="Recommended picks">
      <ul className="mx-auto max-w-4xl space-y-3">
        {RECOMMENDED.map((item) => (
          <RecommendedRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

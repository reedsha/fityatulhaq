"use client";

import { Lightbulb } from "lucide-react";
import type { ReactElement } from "react";

import { YOUTH_ADVICE_ARTICLES } from "@/lib/knowledgeItemsData";

function AdviceCard({ article }: { article: (typeof YOUTH_ADVICE_ARTICLES)[number] }): ReactElement {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
        {article.topic}
      </span>

      <h3 className="mt-3 text-heading-4 text-ink-900">{article.title}</h3>

      <div className="mt-2 flex-1 space-y-2">
        {article.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-body-sm leading-relaxed text-ink-600">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}

export default function YouthAdviceSection(): ReactElement {
  return (
    <section aria-label="Youth advice">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-300 text-brand-950">
          <Lightbulb aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
        </div>
        <p className="max-w-lg text-body-sm text-ink-300">
          Written by young members, for young members. Suggest a topic on the Youth Care board.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {YOUTH_ADVICE_ARTICLES.map((article) => (
          <li key={article.id}>
            <AdviceCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  );
}

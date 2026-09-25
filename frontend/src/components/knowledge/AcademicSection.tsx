"use client";

import { FileText } from "lucide-react";
import type { ReactElement } from "react";

import { useAuth } from "@/context/AuthContext";
import { PAPERS } from "@/lib/knowledgeItemsData";
import { formatDate } from "@/lib/validation";

import { DownloadButton, LoginToDownloadLink } from "./gatedActions";

function PaperCard({ paper }: { paper: (typeof PAPERS)[number] }): ReactElement {
  const { isAuthenticated } = useAuth();

  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <FileText aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
        </div>
        <span className="text-caption text-ink-500">
          <time dateTime={paper.publishedAt}>{formatDate(paper.publishedAt)}</time>
        </span>
      </div>

      <h3 className="mt-4 text-heading-4 text-ink-900">{paper.title}</h3>
      <p className="mt-1 text-caption font-medium text-ink-500">{paper.authors}</p>
      <p className="mt-2 flex-1 text-body-sm leading-relaxed text-ink-600">{paper.abstract}</p>

      {/* Display-only tags — filtering arrives with /search (M5). */}
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="แท็ก">
        {paper.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700"
          >
            {tag}
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-ink-200 pt-4">
        {isAuthenticated ? (
          <DownloadButton assetId={paper.assetId} fileType={paper.fileType} returnTo="/knowledge/academic" />
        ) : (
          <LoginToDownloadLink returnTo="/knowledge/academic" />
        )}
      </div>
    </article>
  );
}

export default function AcademicSection(): ReactElement {
  return (
    <section aria-label="งานวิชาการ">
      <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {PAPERS.map((paper) => (
          <li key={paper.id}>
            <PaperCard paper={paper} />
          </li>
        ))}
      </ul>
    </section>
  );
}

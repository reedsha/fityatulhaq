"use client";

import Link from "next/link";
import { ChevronDown, MessagesSquare } from "lucide-react";
import { useState, type ReactElement } from "react";
import toast from "react-hot-toast";

import { FOCUS_RING } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { QA_ENTRIES, type QaEntry } from "@/lib/knowledgeItemsData";
import { loginReturnHref } from "@/lib/memberGate";
import { formatDate } from "@/lib/validation";

function QaItem({ entry }: { entry: QaEntry }): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const buttonId = `qa-button-${entry.id}`;
  const panelId = `qa-panel-${entry.id}`;

  return (
    <li>
      <article className="rounded-xl bg-white shadow-card">
        <button
          type="button"
          id={buttonId}
          onClick={(): void => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition duration-fast ease-standard motion-reduce:transition-none hover:bg-ink-50 ${
            isOpen ? "rounded-t-xl" : "rounded-xl"
          } ${FOCUS_RING}`}
        >
          <span className="text-body font-semibold text-ink-900">{entry.question}</span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-fast ease-standard motion-reduce:transition-none ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen ? (
          <div
            role="region"
            id={panelId}
            aria-labelledby={buttonId}
            className="border-t border-ink-200 px-5 pb-5 pt-4"
          >
            <p className="text-body-sm leading-relaxed text-ink-600">{entry.answer}</p>
            <p className="mt-3 text-caption text-ink-400">
              Answered <time dateTime={entry.answeredAt}>{formatDate(entry.answeredAt)}</time>
            </p>
          </div>
        ) : null}
      </article>
    </li>
  );
}

export default function QaSection(): ReactElement {
  const { isAuthenticated } = useAuth();

  const handleAsk = (): void => {
    toast("Question logging arrives with the Youth Care board (M4) — meanwhile, ask on the webboard.", {
      icon: "ℹ️",
      duration: 7000,
    });
  };

  return (
    <section aria-label="Q&A corner">
      <ul className="mx-auto max-w-4xl space-y-3">
        {QA_ENTRIES.map((entry) => (
          <QaItem key={entry.id} entry={entry} />
        ))}
      </ul>

      {/* Ask area — the member action; honest deferral until M4. */}
      <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-6 text-center shadow-card">
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <MessagesSquare aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
          </div>
        </div>
        <h3 className="mt-3 text-heading-4 text-ink-900">Have a question of your own?</h3>
        <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-ink-600">
          Member questions are queued for the Youth Care board, where approved questions get
          answers from the community.
        </p>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleAsk}
            className={`mt-5 inline-flex items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING}`}
          >
            Ask a question
          </button>
        ) : (
          <Link
            href={loginReturnHref("/knowledge/qa")}
            className={`mt-5 inline-flex items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING}`}
          >
            Log in to ask
          </Link>
        )}

        <p className="mt-4 text-caption text-ink-500">
          Meanwhile, the{" "}
          <Link
            href="/webboard/youth-care"
            className={`font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-600 ${FOCUS_RING}`}
          >
            Youth Care board
          </Link>{" "}
          is open to members right now.
        </p>
      </div>
    </section>
  );
}

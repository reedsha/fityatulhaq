"use client";

import { MessageSquare, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react";

import { SectionHeading } from "@/components/home/SectionHeading";
import { SkeletonSection } from "@/components/home/Skeleton";
import { formatDate, timeAgo } from "@/lib/validation";

export interface ThreadPreview {
  id: string;
  board: string;
  title: string;
  lastReplyAt: string;
  replyCount: number;
  isNew?: boolean;
}

export interface WebboardThreadsProps {
  threads: ThreadPreview[];
  onViewBoard: (board: string) => void;
  /** False for guests: posting is offered, but points at the sign-in page. */
  canPost?: boolean;
  isLoading?: boolean;
}

/** URL segment for a board, e.g. "Youth Care" → "youth-care". */
function boardPath(board: string): string {
  return board
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Relative timestamps must not be rendered during prerender: `timeAgo` reads the
 * clock, so the static HTML would disagree with the browser and React would
 * flag a hydration mismatch. The formatted date is the stable first paint, and
 * the relative label replaces it once the client is live.
 */
function RelativeTime({ iso }: { iso: string }): ReactElement {
  const [label, setLabel] = useState<string>((): string => formatDate(iso));

  useEffect((): void => {
    setLabel(timeAgo(iso));
  }, [iso]);

  return <time dateTime={iso}>{label}</time>;
}

/**
 * Community discussion preview.
 *
 * Board tabs are derived from the threads handed in, so an empty board can never
 * be offered, and the tabs implement the WAI-ARIA tab pattern including
 * arrow-key movement between them.
 */
export function WebboardThreads({
  threads,
  onViewBoard,
  canPost = false,
  isLoading = false,
}: WebboardThreadsProps): ReactElement {
  const boards = useMemo((): string[] => {
    const seen: string[] = [];

    for (const thread of threads) {
      if (!seen.includes(thread.board)) {
        seen.push(thread.board);
      }
    }

    return seen;
  }, [threads]);

  const [activeBoard, setActiveBoard] = useState<string>("");
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);

  // The board list is derived data, so the selection follows it rather than
  // being guessed before the first render.
  const selectedBoard = boards.includes(activeBoard) ? activeBoard : boards[0] ?? "";

  const visibleThreads = useMemo(
    (): ThreadPreview[] => threads.filter((thread) => thread.board === selectedBoard),
    [selectedBoard, threads],
  );

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (boards.length < 2) {
      return;
    }

    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

    if (step === 0) {
      return;
    }

    event.preventDefault();

    const nextIndex = (index + step + boards.length) % boards.length;
    const nextBoard = boards[nextIndex];

    if (nextBoard !== undefined) {
      setActiveBoard(nextBoard);
      tabListRef.current
        ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
        [nextIndex]?.focus();
    }
  };

  const handleNewThread = (): void => {
    if (canPost) {
      onViewBoard(selectedBoard);
      return;
    }

    setIsPromptVisible(true);
  };

  if (isLoading) {
    return (
      <section aria-label="Community discussions">
        <SkeletonSection count={3} cardClassName="h-16" label="community discussions" />
      </section>
    );
  }

  return (
    <section aria-label="Community discussions">
      <SectionHeading
        title="Community Discussions"
        action={<p className="text-body-sm text-ink-500">Latest activity from our forum boards.</p>}
      />

      {boards.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-body-sm text-ink-500">
          No discussions have started yet. Be the first to post.
        </p>
      ) : (
        <>
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Forum boards"
            className="mt-6 flex items-center gap-6 border-b border-ink-200"
          >
            {boards.map((board, index) => {
              const isSelected = board === selectedBoard;

              return (
                <button
                  key={board}
                  type="button"
                  role="tab"
                  id={`board-tab-${boardPath(board)}`}
                  aria-selected={isSelected}
                  aria-controls={`board-panel-${boardPath(board)}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={(): void => setActiveBoard(board)}
                  onKeyDown={(event): void => handleTabKeyDown(event, index)}
                  className={`-mb-px border-b-2 px-1 pb-3 text-body-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-brand-700 text-brand-700"
                      : "border-transparent text-ink-500 hover:text-ink-700"
                  }`}
                >
                  {board}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`board-panel-${boardPath(selectedBoard)}`}
            aria-labelledby={`board-tab-${boardPath(selectedBoard)}`}
          >
            {visibleThreads.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-body-sm text-ink-500">
                Nothing has been posted to this board yet.
              </p>
            ) : (
              <ul className="mt-6 max-h-[400px] space-y-2 overflow-y-auto pr-1">
                {visibleThreads.map((thread) => (
                  <li key={thread.id}>
                    <a
                      href={`/webboard/${boardPath(thread.board)}`}
                      className="group flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3 transition hover:border-brand-600 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                    >
                      {thread.isNew === true ? (
                        <span
                          aria-label="New thread"
                          role="img"
                          className="h-2 w-2 shrink-0 rounded-full bg-state-error-500"
                        />
                      ) : null}

                      <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-ink-900 group-hover:text-brand-700">
                        {thread.title}
                      </span>

                      <span
                        aria-label={`${thread.replyCount} replies`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-caption font-medium text-ink-600"
                      >
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        {thread.replyCount}
                      </span>

                      <span className="hidden shrink-0 text-caption text-ink-400 sm:inline">
                        <RelativeTime iso={thread.lastReplyAt} />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={(): void => onViewBoard(selectedBoard)}
                className="inline-flex w-fit items-center gap-1 text-body-sm font-semibold text-brand-700 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                Go to Webboard →
              </button>

              <button
                type="button"
                onClick={handleNewThread}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-body-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Thread
              </button>
            </div>

            {isPromptVisible ? (
              <p
                role="status"
                className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-body-sm text-brand-800"
              >
                Please{" "}
                <a
                  href="/login"
                  className="font-semibold underline underline-offset-2"
                  onClick={(): void => setIsPromptVisible(false)}
                >
                  sign in
                </a>{" "}
                to start a new thread.
              </p>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useCallback, useState, type ReactElement } from "react";

import { useWebboardResource } from "@/hooks/useWebboardResource";
import {
  BOARD_META,
  THREAD_SORTS,
  THREAD_SORT_LABELS,
  YOUTH_CARE_FILTERS,
  YOUTH_CARE_FILTER_LABELS,
  fetchTags,
  fetchThreads,
  newThreadPath,
  type BoardKey,
  type ThreadSort,
  type YouthCareFilter,
} from "@/lib/webboardApi";
import { FOCUS_RING } from "@/components/layout/Header";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  MemberActionLink,
  Pager,
  PRIMARY_BUTTON_CLASSES,
  ThreadCard,
  totalPagesOf,
} from "./webboardUi";

/**
 * One board's thread list — shared by `/webboard/youth-care` (§5.3.2) and
 * `/webboard/general` (§5.3.3).
 *
 * The two boards differ in exactly two controls, so they are one component with
 * a `board` prop rather than two near-copies:
 *
 *  - §5.3.2 asks for the "รอตอบ / ทีมงานตอบแล้ว" status toggle → Youth Care.
 *  - §5.3.3 asks for tags and the latest/popular/most-replied sort → general.
 *
 * Filters live in component state rather than the URL. The PRD does not ask for
 * shareable filter links, and keeping the route static means the page prerenders
 * instead of bailing out to a Suspense boundary.
 */

const SELECT_CLASSES =
  "rounded-lg border border-ink-200 bg-white px-3 py-2 text-body-sm text-ink-900 transition duration-fast ease-standard motion-reduce:transition-none focus:border-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

const FILTER_CHIP_CLASSES = "rounded-full border px-3.5 py-1.5 text-caption font-medium transition duration-fast ease-standard motion-reduce:transition-none";

const FILTER_CHIP_ACTIVE = "border-brand-600 bg-brand-600 text-white";
const FILTER_CHIP_IDLE = "border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-700";

export function BoardThreadList({ board }: { board: BoardKey }): ReactElement {
  const meta = BOARD_META[board];

  const [sort, setSort] = useState<ThreadSort>(THREAD_SORTS.LATEST);
  const [filter, setFilter] = useState<YouthCareFilter>(YOUTH_CARE_FILTERS.ALL);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const tagsResource = useWebboardResource(fetchTags, "webboard-tags");

  const threadsResource = useWebboardResource(
    (signal) => fetchThreads({ board, sort, filter, tag: activeTag, page, signal }),
    `${board}|${sort}|${filter}|${activeTag ?? ""}|${page}`,
  );

  const selectFilter = useCallback((next: YouthCareFilter): void => {
    setFilter(next);
    setPage(1);
  }, []);

  const selectSort = useCallback((next: ThreadSort): void => {
    setSort(next);
    setPage(1);
  }, []);

  const selectTag = useCallback((next: string | null): void => {
    setActiveTag(next);
    setPage(1);
  }, []);

  const tags = tagsResource.data ?? [];
  const tagLabels: Record<string, string> = {};

  for (const tag of tags) {
    tagLabels[tag.slug] = tag.label;
  }

  const threads = threadsResource.data?.data ?? [];
  const pagination = threadsResource.data?.pagination ?? null;
  const totalPages = totalPagesOf(pagination);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-body-sm text-ink-600">
          {meta.isAnonymous
            ? "คำถามใหม่ทุกข้อจะเข้าสู่การตรวจสอบก่อนเผยแพร่ และแสดงชื่อผู้ถามเป็นผู้ใช้นิรนามเสมอ"
            : "กระทู้ใหม่แสดงผลทันที ทีมงานจะตรวจสอบย้อนหลังเมื่อมีรายงานเนื้อหา"}
        </p>

        <MemberActionLink returnTo={newThreadPath(board)} className={PRIMARY_BUTTON_CLASSES}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          {meta.newThreadLabel}
        </MemberActionLink>
      </div>

      {meta.hasAnswerStatus ? (
        <nav aria-label="กรองตามสถานะคำตอบ">
          <ul className="flex flex-wrap items-center gap-2">
            {Object.values(YOUTH_CARE_FILTERS).map((value) => {
              const isActive = value === filter;

              return (
                <li key={value}>
                  <button
                    type="button"
                    onClick={(): void => {
                      selectFilter(value);
                    }}
                    aria-pressed={isActive}
                    className={`${FILTER_CHIP_CLASSES} ${isActive ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE} ${FOCUS_RING}`}
                  >
                    {YOUTH_CARE_FILTER_LABELS[value]}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {meta.allowsTags ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="webboard-sort" className="text-caption font-semibold text-ink-600">
              เรียงลำดับ
            </label>

            <select
              id="webboard-sort"
              value={sort}
              onChange={(event): void => {
                selectSort(event.target.value as ThreadSort);
              }}
              className={SELECT_CLASSES}
            >
              {Object.values(THREAD_SORTS).map((value) => (
                <option key={value} value={value}>
                  {THREAD_SORT_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          {tags.length > 0 ? (
            <nav aria-label="กรองตามแท็ก">
              <ul className="flex flex-wrap items-center gap-2">
                <li>
                  <button
                    type="button"
                    onClick={(): void => {
                      selectTag(null);
                    }}
                    aria-pressed={activeTag === null}
                    className={`${FILTER_CHIP_CLASSES} ${activeTag === null ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE} ${FOCUS_RING}`}
                  >
                    ทุกแท็ก
                  </button>
                </li>

                {tags.map((tag) => {
                  const isActive = tag.slug === activeTag;

                  return (
                    <li key={tag.slug}>
                      <button
                        type="button"
                        onClick={(): void => {
                          selectTag(tag.slug);
                        }}
                        aria-pressed={isActive}
                        className={`${FILTER_CHIP_CLASSES} ${isActive ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE} ${FOCUS_RING}`}
                      >
                        {tag.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </div>
      ) : null}

      {/* The list updates in place; this announces the change to screen readers. */}
      <p aria-live="polite" className="sr-only">
        {threadsResource.isLoading ? "กำลังโหลดกระทู้" : `พบ ${pagination?.total ?? threads.length} กระทู้`}
      </p>

      {threadsResource.error !== null ? (
        <ErrorState message={threadsResource.error} onRetry={threadsResource.reload} />
      ) : null}

      {threadsResource.isLoading && threadsResource.data === null ? (
        <>
          <LoadingBlock label="กำลังโหลดกระทู้" />
          <LoadingBlock label="กำลังโหลดกระทู้" />
        </>
      ) : null}

      {!threadsResource.isLoading && threadsResource.error === null && threads.length === 0 ? (
        <EmptyState
          title={meta.isAnonymous ? "ยังไม่มีคำถามในบอร์ดนี้" : "ยังไม่มีกระทู้ในบอร์ดนี้"}
          description={
            meta.allowsTags && activeTag !== null
              ? "ลองเลือกแท็กอื่น หรือดูกระทู้ทั้งหมด"
              : "กระทู้จะปรากฏขึ้นเมื่อสมาชิกเริ่มตั้งกระทู้"
          }
        />
      ) : null}

      {threads.length > 0 ? (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li key={thread.id}>
              <ThreadCard thread={thread} showBoardBadge={false} labels={tagLabels} />
            </li>
          ))}
        </ul>
      ) : null}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

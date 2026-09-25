"use client";

import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";

import {
  AnswerStatusChip,
  CARD_CLASSES,
  EmptyState,
  Pager,
  WEBBOARD_LINK_CLASSES,
  totalPagesOf,
} from "@/components/webboard/webboardUi";
import { useWebboardResource } from "@/hooks/useWebboardResource";
import { fetchMyThreads, type MyThread } from "@/lib/activitiesApi";
import { timeAgo } from "@/lib/validation";
import { MODERATION_STATUSES, threadPath } from "@/lib/webboardApi";

import { ActivityList, BoardBadge, ModerationChip, ModerationNote } from "./activitiesUi";

/**
 * §5.4.5 — "กระทู้ของฉัน", the author's own threads and questions.
 *
 * Unlike the public boards this list includes PENDING and REJECTED rows: §7.1
 * routes an author's view of their own unreviewed question here, and the
 * moderation chip plus the reason note are the whole point of the tab. The
 * `isAnswered` chip only appears where the backend sets it (Youth Care), so it
 * is not shown on every row.
 */
export function MyThreadsTab({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}): ReactElement {
  const resource = useWebboardResource(
    (signal) => fetchMyThreads(page, signal),
    `my-threads|${page}`,
  );

  const threads = resource.data?.data ?? [];
  const totalPages = totalPagesOf(resource.data?.pagination ?? null);

  return (
    <ActivityList
      isLoading={resource.isLoading}
      hasData={resource.data !== null}
      error={resource.error}
      isEmpty={threads.length === 0}
      onRetry={resource.reload}
      loadingLabel="กำลังโหลดกระทู้ของคุณ"
      liveMessage={
        resource.isLoading ? "กำลังโหลดกระทู้ของคุณ" : `พบ ${threads.length} กระทู้`
      }
      empty={
        <EmptyState
          title="ยังไม่มีกระทู้"
          description="เมื่อคุณตั้งกระทู้หรือคำถาม กระทู้เหล่านั้นจะปรากฏที่นี่พร้อมสถานะการตรวจสอบ"
        >
          <Link href="/webboard" className={WEBBOARD_LINK_CLASSES}>
            ไปที่เว็บบอร์ดเพื่อเริ่มตั้งกระทู้
          </Link>
        </EmptyState>
      }
    >
      {threads.length > 0 ? (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li key={thread.id}>
              <MyThreadCard thread={thread} />
            </li>
          ))}
        </ul>
      ) : null}

      <Pager page={page} totalPages={totalPages} onChange={onPageChange} />
    </ActivityList>
  );
}

function MyThreadCard({ thread }: { thread: MyThread }): ReactElement {
  // Only a PUBLISHED thread has a public page: `getThread` filters to PUBLISHED
  // for everyone, its author included (§7.1 hides unreviewed content even from
  // the person who wrote it). A link from a PENDING or REJECTED row would
  // therefore land on "ไม่พบกระทู้" — so an unreviewed title is plain text, and the
  // status chip plus the moderator's note below are what tell the story instead.
  const isOpenable = thread.moderation === MODERATION_STATUSES.PUBLISHED;

  return (
    <article className={CARD_CLASSES}>
      <div className="flex flex-wrap items-center gap-2">
        <BoardBadge board={thread.board} />
        <ModerationChip status={thread.moderation} />
        {thread.isAnswered ? <AnswerStatusChip isAnswered /> : null}
      </div>

      <h3 className="mt-3 text-heading-4">
        {isOpenable ? (
          <Link href={threadPath(thread.board, thread.id)} className={WEBBOARD_LINK_CLASSES}>
            {thread.title}
          </Link>
        ) : (
          thread.title
        )}
      </h3>

      <p className="mt-2 text-body-sm text-ink-600">{thread.excerpt}</p>

      <ModerationNote note={thread.moderationNote} />

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-ink-200 pt-3 text-caption text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
          {`${thread.commentCount}`}
          <span className="sr-only">ความคิดเห็น</span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <Heart aria-hidden="true" className="h-3.5 w-3.5" />
          {`${thread.likeCount}`}
          <span className="sr-only">ถูกใจ</span>
        </span>

        <time dateTime={thread.createdAt}>{timeAgo(thread.createdAt)}</time>
      </div>
    </article>
  );
}

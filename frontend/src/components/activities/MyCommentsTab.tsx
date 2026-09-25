"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import {
  CARD_CLASSES,
  EmptyState,
  Pager,
  WEBBOARD_LINK_CLASSES,
  totalPagesOf,
} from "@/components/webboard/webboardUi";
import { useWebboardResource } from "@/hooks/useWebboardResource";
import { fetchMyComments, type MyComment } from "@/lib/activitiesApi";
import { timeAgo } from "@/lib/validation";
import { threadPath } from "@/lib/webboardApi";

import {
  ActivityList,
  BoardBadge,
  ModerationChip,
  ModerationNote,
  OfficialAnswerChip,
} from "./activitiesUi";

/**
 * §5.4.5 — "ความคิดเห็นของฉัน", the author's own replies.
 *
 * Each row links back to the thread it belongs to (§7.1's "ไปดูต้นทาง" instinct):
 * the comment itself is not a standalone page, so the thread title is the only
 * navigable thing here and is labelled as such.
 */
export function MyCommentsTab({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}): ReactElement {
  const resource = useWebboardResource(
    (signal) => fetchMyComments(page, signal),
    `my-comments|${page}`,
  );

  const comments = resource.data?.data ?? [];
  const totalPages = totalPagesOf(resource.data?.pagination ?? null);

  return (
    <ActivityList
      isLoading={resource.isLoading}
      hasData={resource.data !== null}
      error={resource.error}
      isEmpty={comments.length === 0}
      onRetry={resource.reload}
      loadingLabel="กำลังโหลดความคิดเห็นของคุณ"
      liveMessage={
        resource.isLoading ? "กำลังโหลดความคิดเห็นของคุณ" : `พบ ${comments.length} ความคิดเห็น`
      }
      empty={
        <EmptyState
          title="ยังไม่มีความคิดเห็น"
          description="เมื่อคุณแสดงความคิดเห็นในกระทู้ ความคิดเห็นเหล่านั้นจะปรากฏที่นี่"
        >
          <Link href="/webboard" className={WEBBOARD_LINK_CLASSES}>
            ไปที่เว็บบอร์ดเพื่อร่วมแสดงความคิดเห็น
          </Link>
        </EmptyState>
      }
    >
      {comments.length > 0 ? (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id}>
              <MyCommentCard comment={comment} />
            </li>
          ))}
        </ul>
      ) : null}

      <Pager page={page} totalPages={totalPages} onChange={onPageChange} />
    </ActivityList>
  );
}

function MyCommentCard({ comment }: { comment: MyComment }): ReactElement {
  return (
    <article className={CARD_CLASSES}>
      <div className="flex flex-wrap items-center gap-2">
        <BoardBadge board={comment.board} />
        <ModerationChip status={comment.moderation} />
        {comment.isOfficial ? <OfficialAnswerChip /> : null}
      </div>

      <p className="mt-3 text-body-sm text-ink-600">
        <span>ในกระทู้: </span>
        <Link
          href={threadPath(comment.board, comment.threadId)}
          className={WEBBOARD_LINK_CLASSES}
        >
          {comment.threadTitle}
        </Link>
      </p>

      <p className="mt-2 whitespace-pre-line text-body-sm text-ink-800">{comment.excerpt}</p>

      <ModerationNote note={comment.moderationNote} />

      <div className="mt-4 border-t border-ink-200 pt-3">
        <time dateTime={comment.createdAt} className="text-caption text-ink-500">
          {timeAgo(comment.createdAt)}
        </time>
      </div>
    </article>
  );
}

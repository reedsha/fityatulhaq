"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, type ReactElement } from "react";

import { useWebboardResource } from "@/hooks/useWebboardResource";
import {
  BOARD_META,
  boardPath,
  fetchTags,
  fetchThread,
  threadPath,
  type BoardKey,
} from "@/lib/webboardApi";

import { CommentComposer, CommentTree } from "./CommentTree";
import { LikeButton } from "./LikeButton";
import { ReportPanel, ReportTrigger } from "./ReportPanel";
import {
  AnswerStatusChip,
  AuthorLine,
  CARD_CLASSES,
  EmptyState,
  ErrorState,
  FullDate,
  LoadingBlock,
  SECONDARY_BUTTON_CLASSES,
  TagBadges,
  WEBBOARD_LINK_CLASSES,
} from "./webboardUi";

/**
 * `/webboard/[board]/[postId]` — SRS §5.3.4.
 *
 * Read is public; commenting, reacting and reporting are member actions, and
 * each of those controls is the same shape for a guest — a link through the
 * login return flow — so the page never hides an action that exists.
 *
 * A thread that is PENDING, REJECTED or HIDDEN answers 404 from the API, which
 * this page renders as "not found" with a route back to the board rather than as
 * a retryable error: §7.1 does not let the pre-moderation gate leak the
 * existence of unreviewed content, and retrying will not change that.
 */

export function ThreadDetail({ board, postId }: { board: BoardKey; postId: string }): ReactElement {
  const meta = BOARD_META[board];
  const returnTo = threadPath(board, postId);

  const threadResource = useWebboardResource(
    (signal) => fetchThread(board, postId, signal),
    `${board}|${postId}`,
  );
  const tagsResource = useWebboardResource(fetchTags, "webboard-tags");

  const [isReporting, setIsReporting] = useState(false);

  const tagLabels: Record<string, string> = {};

  for (const tag of tagsResource.data ?? []) {
    tagLabels[tag.slug] = tag.label;
  }

  const { data: thread, isLoading, error, errorCode, reload } = threadResource;

  if (isLoading && thread === null) {
    return (
      <div className="space-y-4">
        <LoadingBlock label="กำลังโหลดกระทู้" />
        <LoadingBlock label="กำลังโหลดความคิดเห็น" />
      </div>
    );
  }

  if (thread === null) {
    if (errorCode === "THREAD_NOT_FOUND") {
      return (
        <EmptyState
          title="ไม่พบกระทู้นี้"
          description="กระทู้อาจถูกลบไปแล้ว หรือยังไม่ผ่านการตรวจสอบจากทีมงาน"
        >
          <Link href={boardPath(board)} className={SECONDARY_BUTTON_CLASSES}>
            กลับไปที่{meta.title}
          </Link>
        </EmptyState>
      );
    }

    return (
      <ErrorState
        message={error ?? "โหลดกระทู้ไม่สำเร็จ กรุณาลองอีกครั้ง"}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav aria-label="เส้นทางนำทาง">
        <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-500">
          <li>
            <Link href="/" className={WEBBOARD_LINK_CLASSES}>
              หน้าแรก
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link href="/webboard" className={WEBBOARD_LINK_CLASSES}>
              เว็บบอร์ด
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link href={boardPath(board)} className={WEBBOARD_LINK_CLASSES}>
              {meta.title}
            </Link>
          </li>
        </ol>
      </nav>

      <article className={CARD_CLASSES}>
        <div className="flex flex-wrap items-center gap-2">
          {thread.isAnswered ? <AnswerStatusChip isAnswered /> : null}
          {thread.tags.length > 0 ? <TagBadges slugs={thread.tags} labels={tagLabels} /> : null}
        </div>

        <h2 className="mt-3 text-heading-2 text-ink-900">{thread.title}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <AuthorLine author={thread.author} />
          <FullDate iso={thread.createdAt} />
        </div>

        <p className="mt-4 whitespace-pre-line text-body text-ink-800">{thread.body}</p>

        <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-ink-200 pt-3">
          <LikeButton
            target={{ type: "thread", id: thread.id }}
            likedByViewer={thread.likedByViewer}
            likeCount={thread.likeCount}
            returnTo={returnTo}
          />

          <ReportTrigger
            isOpen={isReporting}
            onToggle={(): void => {
              setIsReporting((open) => !open);
            }}
          />
        </div>

        {isReporting ? (
          <ReportPanel
            postId={thread.id}
            commentId={null}
            returnTo={returnTo}
            onClose={(): void => {
              setIsReporting(false);
            }}
          />
        ) : null}
      </article>

      <section aria-label="ความคิดเห็น" className="space-y-4">
        <h2 className="text-heading-3 text-ink-900">{`ความคิดเห็น (${thread.commentCount})`}</h2>

        <CommentComposer
          board={board}
          postId={thread.id}
          parentId={null}
          returnTo={returnTo}
          heading="ร่วมแสดงความคิดเห็น"
          submitLabel="ส่งความคิดเห็น"
          onPublished={reload}
        />

        <CommentTree
          comments={thread.comments}
          board={board}
          postId={thread.id}
          returnTo={returnTo}
          onChanged={reload}
        />
      </section>

      <nav className="flex flex-wrap gap-3">
        <Link href={boardPath(board)} className={SECONDARY_BUTTON_CLASSES}>
          กลับไปที่{meta.title}
        </Link>
      </nav>

      <p className="text-caption text-ink-500">
        <Link href="/terms" className={WEBBOARD_LINK_CLASSES}>
          อ่านกติกาการใช้งานเว็บบอร์ด
        </Link>
      </p>
    </div>
  );
}

"use client";

import { CornerDownRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type ReactElement } from "react";
import toast from "react-hot-toast";

import { FormField } from "@/components/auth/FormField";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { loginReturnHref } from "@/lib/memberGate";
import { timeAgo } from "@/lib/validation";
import {
  BOARD_META,
  MODERATION_STATUSES,
  createComment,
  type BoardKey,
  type CommentNode,
} from "@/lib/webboardApi";

import { LikeButton } from "./LikeButton";
import { ReportPanel, ReportTrigger } from "./ReportPanel";
import {
  AuthorLine,
  CARD_CLASSES,
  EmptyState,
  LoadingBlock,
  SECONDARY_BUTTON_CLASSES,
  QUIET_BUTTON_CLASSES,
  resolveWriteError,
} from "./webboardUi";

/**
 * §5.3.4 — the reply tree under a thread.
 *
 * Nesting is real (the backend stores a `parentId`), and the visual indent stops
 * after three levels: a deep chain would otherwise be squeezed to a few
 * characters on a phone, and the left rule still shows the grouping. The
 * semantic nesting is unaffected — it is only the indentation that is capped.
 *
 * On Youth Care a reply is pre-moderated like the question it answers (§7.1), so
 * the composer reports "รอการตรวจสอบ" instead of pretending the reply is live.
 */

/** Mirrors `createCommentSchema` in the backend. */
const MAX_COMMENT_LENGTH = 5000;

const VISUAL_INDENT_DEPTH = 3;

const INDENT_CLASSES = "ml-3 border-l border-ink-200 pl-3 sm:ml-5 sm:pl-4";

function OfficialBadge(): ReactElement {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-caption font-semibold text-brand-800">
      <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
      คำตอบจากทีมงาน
    </span>
  );
}

export interface CommentComposerProps {
  board: BoardKey;
  postId: string;
  /** Null posts a top-level reply; an id answers that comment. */
  parentId: string | null;
  returnTo: string;
  /** Called once a reply is publicly visible, so the tree can refresh. */
  onPublished: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  heading?: string;
}

export function CommentComposer(props: CommentComposerProps): ReactElement {
  const { board, postId, parentId, returnTo, onPublished, onCancel, submitLabel, heading } = props;
  const { isAuthenticated, isLoading } = useAuth();

  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const meta = BOARD_META[board];

  if (isLoading) {
    return <LoadingBlock label="กำลังโหลดเซสชันของคุณ" />;
  }

  // §5.3.4's wording, verbatim: the composer is visible but locked.
  if (!isAuthenticated) {
    return (
      <div className={`${CARD_CLASSES} text-center`}>
        <p className="text-body-sm text-ink-600">เข้าสู่ระบบเพื่อร่วมแสดงความคิดเห็น</p>

        <Link href={loginReturnHref(returnTo)} className={`mt-3 ${SECONDARY_BUTTON_CLASSES}`}>
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmed = body.trim();

    if (trimmed.length === 0) {
      setFieldError("กรุณากรอกความคิดเห็น");
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);

    try {
      const result = await createComment(board, postId, {
        body: trimmed,
        parentId,
        anonymous,
      });

      setBody("");

      if (result.moderation === MODERATION_STATUSES.PUBLISHED) {
        setAnonymous(false);
        onPublished();
        return;
      }

      toast.success("ส่งความคิดเห็นแล้ว รอการตรวจสอบก่อนเผยแพร่");
      onPublished();
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONTENT_FLAGGED") {
        setFieldError("ข้อความมีถ้อยคำที่ไม่เหมาะสม กรุณาแก้ไขแล้วลองอีกครั้ง");
        return;
      }

      toast.error(resolveWriteError(error, returnTo));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event): void => void handleSubmit(event)}
      className={`${CARD_CLASSES} mt-3 space-y-3`}
      noValidate
    >
      {heading !== undefined ? (
        <p className="text-body-sm font-medium text-ink-700">{heading}</p>
      ) : null}

      <FormField
        id={`comment-body-${parentId ?? "root"}`}
        name="body"
        label="ความคิดเห็น"
        value={body}
        onChange={(_, value): void => {
          setBody(value);
          setFieldError(null);
        }}
        error={fieldError ?? undefined}
        multiline
        rows={parentId === null ? 5 : 3}
        maxLength={MAX_COMMENT_LENGTH}
        disabled={isSubmitting}
      />

      {meta.isAnonymous ? (
        <label className="flex items-start gap-2 text-caption text-ink-600">
          <input
            type="checkbox"
            checked={anonymous}
            disabled={isSubmitting}
            onChange={(event): void => {
              setAnonymous(event.target.checked);
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          />
          <span>ปกปิดตัวตนอย่างเข้มงวดสำหรับความคิดเห็นนี้</span>
        </label>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-caption font-bold text-white transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          {isSubmitting ? "กำลังส่ง..." : submitLabel ?? "ส่งความคิดเห็น"}
        </button>

        {onCancel !== undefined ? (
          <button type="button" onClick={onCancel} disabled={isSubmitting} className={QUIET_BUTTON_CLASSES}>
            ยกเลิก
          </button>
        ) : null}
      </div>
    </form>
  );
}

interface CommentItemProps {
  comment: CommentNode;
  board: BoardKey;
  postId: string;
  returnTo: string;
  depth: number;
  onChanged: () => void;
}

function CommentItem(props: CommentItemProps): ReactElement {
  const { comment, board, postId, returnTo, depth, onChanged } = props;
  const { isAuthenticated } = useAuth();

  const [isReplying, setIsReplying] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const isIndented = depth > 0 && depth <= VISUAL_INDENT_DEPTH;

  return (
    <li className={isIndented ? INDENT_CLASSES : undefined}>
      <article className={CARD_CLASSES}>
        <header className="flex flex-wrap items-center gap-2">
          <AuthorLine author={comment.author} />

          {comment.isOfficial ? <OfficialBadge /> : null}

          <time dateTime={comment.createdAt} className="text-caption text-ink-500">
            {timeAgo(comment.createdAt)}
          </time>
        </header>

        <p className="mt-3 whitespace-pre-line text-body-sm text-ink-800">{comment.body}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-ink-200 pt-3">
          <LikeButton
            target={{ type: "comment", id: comment.id }}
            likedByViewer={comment.likedByViewer}
            likeCount={comment.likeCount}
            returnTo={returnTo}
          />

          {isAuthenticated ? (
            <button
              type="button"
              onClick={(): void => {
                setIsReplying((open) => !open);
              }}
              aria-expanded={isReplying}
              className={QUIET_BUTTON_CLASSES}
            >
              <CornerDownRight aria-hidden="true" className="h-3.5 w-3.5" />
              ตอบกลับ
            </button>
          ) : (
            <Link href={loginReturnHref(returnTo)} className={QUIET_BUTTON_CLASSES}>
              <CornerDownRight aria-hidden="true" className="h-3.5 w-3.5" />
              ตอบกลับ
            </Link>
          )}

          {/* The same trigger for everyone: a guest's panel explains that
              reporting is a member action and links them into the login flow. */}
          <ReportTrigger
            isOpen={isReporting}
            onToggle={(): void => {
              setIsReporting((open) => !open);
            }}
          />
        </div>

        {isReporting ? (
          <ReportPanel
            postId={null}
            commentId={comment.id}
            returnTo={returnTo}
            onClose={(): void => {
              setIsReporting(false);
            }}
          />
        ) : null}

        {isReplying ? (
          <CommentComposer
            board={board}
            postId={postId}
            parentId={comment.id}
            returnTo={returnTo}
            heading={`ตอบกลับความคิดเห็นของ ${
              comment.author.kind === "anonymous"
                ? `ผู้ใช้นิรนาม #${comment.author.code}`
                : comment.author.member.fullName
            }`}
            submitLabel="ส่งคำตอบ"
            onPublished={(): void => {
              setIsReplying(false);
              onChanged();
            }}
            onCancel={(): void => {
              setIsReplying(false);
            }}
          />
        ) : null}
      </article>

      {comment.replies.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              board={board}
              postId={postId}
              returnTo={returnTo}
              depth={depth + 1}
              onChanged={onChanged}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CommentTree({
  comments,
  board,
  postId,
  returnTo,
  onChanged,
}: {
  comments: CommentNode[];
  board: BoardKey;
  postId: string;
  returnTo: string;
  onChanged: () => void;
}): ReactElement {
  if (comments.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีความคิดเห็น"
        description="เป็นคนแรกที่ร่วมแสดงความคิดเห็นในกระทู้นี้"
      />
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          board={board}
          postId={postId}
          returnTo={returnTo}
          depth={0}
          onChanged={onChanged}
        />
      ))}
    </ul>
  );
}

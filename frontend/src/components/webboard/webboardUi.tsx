"use client";

import { Flag, Heart, MessageCircle, ShieldCheck, VenetianMask } from "lucide-react";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { FOCUS_RING } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { initialsOf } from "@/lib/avatar";
import { resolveUnknownError } from "@/lib/errorMessages";
import { loginReturnHref } from "@/lib/memberGate";
import { formatDate, timeAgo } from "@/lib/validation";
import {
  BOARDS,
  threadPath,
  type Author,
  type MemberAuthor,
  type ThreadSummary,
} from "@/lib/webboardApi";

/**
 * The webboard's shared presentation layer.
 *
 * Everything here is design-token only (no literal colours) and reused by the
 * hub, both boards, the thread view and the moderation queue, so a board card
 * and a thread card cannot drift apart.
 */

// ---------------------------------------------------------------------------
// Shared class recipes
// ---------------------------------------------------------------------------

export const PRIMARY_BUTTON_CLASSES = `inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-caption font-bold text-white transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export const SECONDARY_BUTTON_CLASSES = `inline-flex items-center justify-center gap-2 rounded-full border border-brand-600 px-5 py-2.5 text-caption font-bold text-brand-700 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export const QUIET_BUTTON_CLASSES = `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold text-ink-600 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-ink-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export const CARD_CLASSES = "rounded-xl border border-ink-200 bg-white p-5 shadow-card";

export const FIELD_CLASSES =
  "w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-body-sm text-ink-900 transition duration-fast ease-standard motion-reduce:transition-none placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

/** Chip that is purely informational (a tag on a card). */
const STATIC_CHIP_CLASSES =
  "inline-flex items-center rounded-full bg-ink-100 px-2.5 py-1 text-caption font-medium text-ink-600";

const LINK_CLASSES = `rounded text-brand-700 underline-offset-4 transition duration-fast ease-standard motion-reduce:transition-none hover:underline ${FOCUS_RING}`;

/** Plain text link used inside breadcrumbs and inline notes. */
export const WEBBOARD_LINK_CLASSES = LINK_CLASSES;

/** The report affordance label, kept in one place so the wording is identical. */
export const REPORT_LABEL = "รายงานเนื้อหาไม่เหมาะสม";

const BOARD_BADGE_LABELS: Record<string, string> = {
  [BOARDS.YOUTH_CARE]: "ดูแลเยาวชน",
  [BOARDS.GENERAL]: "ทั่วไป",
};

// ---------------------------------------------------------------------------
// Authors — §7.1's anonymity is visible right here
// ---------------------------------------------------------------------------

export function AvatarCircle({
  member,
  size = "sm",
}: {
  member: MemberAuthor;
  size?: "sm" | "md";
}): ReactElement {
  const dimension = size === "sm" ? "h-6 w-6" : "h-9 w-9";

  if (member.avatarUrl !== null && member.avatarUrl.length > 0) {
    return (
      // A plain <img>, matching the header and the profile uploader: these are
      // Supabase-hosted URLs, so `next/image` would need remotePatterns.
      <img
        src={member.avatarUrl}
        alt=""
        className={`${dimension} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${dimension} inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-caption font-bold text-brand-800`}
    >
      {initialsOf(member.fullName)}
    </span>
  );
}

/**
 * Renders whoever wrote an item.
 *
 * The union is discriminated, so the anonymous branch cannot fall through to a
 * member byline: there is no `.member` on it to read.
 */
export function AuthorLine({ author }: { author: Author }): ReactElement {
  if (author.kind === "anonymous") {
    return (
      <span className="inline-flex items-center gap-1.5 text-caption text-ink-600">
        <VenetianMask aria-hidden="true" className="h-3.5 w-3.5" />
        {`ผู้ใช้นิรนาม #${author.code}`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-caption text-ink-600">
      <AvatarCircle member={author.member} />
      <span className="font-semibold text-ink-800">{author.member.fullName}</span>
      <span className="text-ink-500">{`@${author.member.username}`}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status, tags and counts
// ---------------------------------------------------------------------------

/** §5.3.2 — "รอตอบ" / "ทีมงานตอบแล้ว". */
export function AnswerStatusChip({ isAnswered }: { isAnswered: boolean }): ReactElement {
  if (isAnswered) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-state-success-100 px-2.5 py-1 text-caption font-semibold text-state-success-700">
        <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
        ทีมงานตอบแล้ว
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-state-warning-100 px-2.5 py-1 text-caption font-semibold text-state-warning-700">
      รอตอบ
    </span>
  );
}

export function TagBadges({
  slugs,
  labels,
}: {
  slugs: readonly string[];
  labels: Record<string, string>;
}): ReactElement | null {
  if (slugs.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {slugs.map((slug) => (
        <li key={slug} className={STATIC_CHIP_CLASSES}>
          {/* Falls back to the slug when the catalogue has not loaded yet, which
              is what the backend's own label lookup does. */}
          {labels[slug] ?? slug}
        </li>
      ))}
    </ul>
  );
}

function CountBadge({
  icon,
  count,
  label,
}: {
  icon: ReactNode;
  count: number;
  label: string;
}): ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 text-caption text-ink-500">
      <span aria-hidden="true">{icon}</span>
      {`${count}`}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * A full date, for a thread header where "3 ชั่วโมงที่แล้ว" is too vague.
 */
export function FullDate({ iso }: { iso: string }): ReactElement {
  return (
    <time dateTime={iso} className="text-caption text-ink-500">
      {formatDate(iso)}
    </time>
  );
}

/**
 * Previous/next pager for a paginated list.
 *
 * Extracted from the board list when the M5 activity tabs needed the same
 * control: the label wording ("หน้า X จาก Y", "ก่อนหน้า", "ถัดไป"), the
 * `QUIET_BUTTON_CLASSES` styling and the `aria-label="แบ่งหน้า"` landmark are part
 * of the house contract, and two copies would eventually disagree about one of
 * them. Buttons rather than links because the caller owns the page number in
 * component state — the URL is not the source of truth for a board list.
 */
export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}): ReactElement | null {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="แบ่งหน้า" className="flex items-center justify-between gap-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={(): void => onChange(Math.max(1, page - 1))}
        className={QUIET_BUTTON_CLASSES}
      >
        ก่อนหน้า
      </button>

      <p className="text-caption text-ink-600">{`หน้า ${page} จาก ${totalPages}`}</p>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={(): void => onChange(Math.min(totalPages, page + 1))}
        className={QUIET_BUTTON_CLASSES}
      >
        ถัดไป
      </button>
    </nav>
  );
}

/**
 * Total pages for a pager block, floored at 1 so an empty list still reports
 * "หน้า 1 จาก 1" rather than a zero the caller would have to guard.
 */
export function totalPagesOf(pagination: { total: number; limit: number } | null): number {
  if (pagination === null || pagination.limit <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(pagination.total / pagination.limit));
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export function LoadingBlock({ label }: { label: string }): ReactElement {
  return (
    <section aria-busy="true" aria-label={label} className={`${CARD_CLASSES} space-y-3`}>
      <div
        aria-hidden="true"
        className="h-5 w-2/3 animate-pulse rounded bg-ink-100 motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="h-4 w-full animate-pulse rounded bg-ink-100 motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="h-4 w-3/4 animate-pulse rounded bg-ink-100 motion-reduce:animate-none"
      />
    </section>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <section className={`${CARD_CLASSES} text-center`}>
      <p className="text-heading-4 text-ink-900">{title}</p>

      {description !== undefined ? (
        <p className="mt-2 text-body-sm text-ink-600">{description}</p>
      ) : null}

      {children !== undefined ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): ReactElement {
  return (
    <section
      role="alert"
      className={`${CARD_CLASSES} border-state-error-200 bg-state-error-50 text-center`}
    >
      <p className="text-body-sm text-ink-900">{message}</p>

      <button type="button" onClick={onRetry} className={`mt-4 ${SECONDARY_BUTTON_CLASSES}`}>
        ลองอีกครั้ง
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Member-only entry points
// ---------------------------------------------------------------------------

/**
 * A link whose destination depends on the session: a member goes to the action,
 * a guest goes to `/login?next=<action>` (the M1.5 return flow).
 *
 * Chosen over a click handler that pushes the login route, because a real link
 * is the accessible shape for navigation — focusable, announces its
 * destination, and works with modifier-clicks. While the session is still being
 * restored only a placeholder renders: emitting the member target first would
 * briefly offer a link that bounces the visitor.
 */
export function MemberActionLink({
  returnTo,
  children,
  className,
}: {
  returnTo: string;
  children: ReactNode;
  className: string;
}): ReactElement {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <span className={`${className} opacity-60`}>{children}</span>;
  }

  return (
    <Link href={isAuthenticated ? returnTo : loginReturnHref(returnTo)} className={className}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Thread card — shared by the hub and both boards
// ---------------------------------------------------------------------------

export function ThreadCard({
  thread,
  showBoardBadge,
  labels,
}: {
  thread: ThreadSummary;
  showBoardBadge: boolean;
  labels: Record<string, string>;
}): ReactElement {
  return (
    <article
      className={`${CARD_CLASSES} transition duration-normal ease-standard motion-reduce:transition-none hover:shadow-card-hover`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {showBoardBadge ? (
          <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-caption font-semibold text-brand-800">
            {BOARD_BADGE_LABELS[thread.board] ?? thread.board}
          </span>
        ) : null}

        {thread.isAnswered ? <AnswerStatusChip isAnswered /> : null}
      </div>

      <h3 className="mt-3 text-heading-4">
        <Link href={threadPath(thread.board, thread.id)} className={LINK_CLASSES}>
          {thread.title}
        </Link>
      </h3>

      <p className="mt-2 text-body-sm text-ink-600">{thread.excerpt}</p>

      <div className="mt-3">
        <TagBadges slugs={thread.tags} labels={labels} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-3">
        <AuthorLine author={thread.author} />

        <div className="flex items-center gap-4">
          <CountBadge
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            count={thread.commentCount}
            label="ความคิดเห็น"
          />
          <CountBadge
            icon={<Heart className="h-3.5 w-3.5" />}
            count={thread.likeCount}
            label="ถูกใจ"
          />
          <time dateTime={thread.createdAt} className="text-caption text-ink-500">
            {timeAgo(thread.createdAt)}
          </time>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Write-failure feedback
// ---------------------------------------------------------------------------

/**
 * Turns a failed write into a Thai message, and sends an expired session back
 * through the login page with a return path.
 *
 * Returns the message so the caller can toast it; the redirect, when it
 * happens, is a side effect — the same split `gatedActions` uses for downloads.
 */
export function resolveWriteError(error: unknown, returnTo: string): string {
  if (error instanceof ApiError && error.status === 401) {
    window.location.href = loginReturnHref(returnTo);
  }

  return resolveUnknownError(error).message;
}

export { Flag as ReportIcon };

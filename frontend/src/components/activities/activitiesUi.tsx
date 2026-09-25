"use client";

import type { ReactElement, ReactNode } from "react";

import { EmptyState, ErrorState, LoadingBlock } from "@/components/webboard/webboardUi";
import {
  BOARD_META,
  MODERATION_STATUSES,
  type BoardKey,
  type ModerationStatus,
} from "@/lib/webboardApi";

/**
 * Presentation layer shared by the `/profile/activities` tabs (§5.4.5 + §7.1).
 *
 * Kept beside the tabs in the same spirit as `webboardUi`: the moderation chip
 * mapping in particular is §7.1's transparency contract. "รอตรวจสอบ / เผยแพร่แล้ว
 * / ถูกปฏิเสธ / ถูกซ่อน" and the moderator's reason note are how an author learns
 * what happened to their own post, so the wording and the semantic tokens live in
 * one place rather than being retyped per tab.
 */

const CHIP_CLASSES =
  "inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold";

/** §7.1 — the author-facing status of their own thread or comment. */
const MODERATION_LABELS: Record<ModerationStatus, string> = {
  [MODERATION_STATUSES.PENDING]: "รอตรวจสอบ",
  [MODERATION_STATUSES.PUBLISHED]: "เผยแพร่แล้ว",
  [MODERATION_STATUSES.REJECTED]: "ถูกปฏิเสธ",
  [MODERATION_STATUSES.HIDDEN]: "ถูกซ่อน",
};

const MODERATION_CLASSES: Record<ModerationStatus, string> = {
  [MODERATION_STATUSES.PENDING]: "bg-state-warning-100 text-state-warning-700",
  [MODERATION_STATUSES.PUBLISHED]: "bg-state-success-100 text-state-success-700",
  [MODERATION_STATUSES.REJECTED]: "bg-state-error-100 text-state-error-700",
  [MODERATION_STATUSES.HIDDEN]: "bg-state-error-100 text-state-error-700",
};

/** The board an item belongs to; matches the badge on the public thread cards. */
export function BoardBadge({ board }: { board: BoardKey }): ReactElement {
  return (
    <span className={`${CHIP_CLASSES} bg-brand-100 text-brand-800`}>
      {BOARD_META[board].title}
    </span>
  );
}

/** §7.1 — "รอตรวจสอบ / เผยแพร่แล้ว / ถูกปฏิเสธ / ถูกซ่อน". */
export function ModerationChip({ status }: { status: ModerationStatus }): ReactElement {
  return (
    <span className={`${CHIP_CLASSES} ${MODERATION_CLASSES[status]}`}>
      {MODERATION_LABELS[status]}
    </span>
  );
}

/** Marks a comment the Youth Care team posted as an official answer. */
export function OfficialAnswerChip(): ReactElement {
  return <span className={`${CHIP_CLASSES} bg-state-success-100 text-state-success-700`}>คำตอบทางการ</span>;
}

/**
 * §7.1 — a moderator's reason for rejecting or hiding content, shown to the
 * author. Renders nothing when there is no note, which is the common case.
 */
export function ModerationNote({ note }: { note: string | null }): ReactElement | null {
  if (note === null || note.trim().length === 0) {
    return null;
  }

  return (
    <p className="mt-3 rounded-lg bg-surface-sunken px-3 py-2 text-caption text-ink-700">
      <span className="font-semibold">เหตุผลจากผู้ดูแล: </span>
      {note}
    </p>
  );
}

/**
 * Shared four-state frame for a paginated activity list: announcement, error,
 * first-load skeleton, empty state, then the caller's rows and pager.
 *
 * The skeleton only stands in before the first page arrives; a refetch keeps the
 * current rows on screen, so changing page does not blank the tab or hide the
 * pager the reader is about to press again.
 */
export function ActivityList({
  isLoading,
  hasData,
  error,
  isEmpty,
  onRetry,
  loadingLabel,
  liveMessage,
  empty,
  children,
}: {
  isLoading: boolean;
  hasData: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
  loadingLabel: string;
  liveMessage: string;
  empty: ReactElement;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="space-y-6">
      {/* The list changes in place; this announces the change to screen readers. */}
      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>

      {error !== null ? <ErrorState message={error} onRetry={onRetry} /> : null}

      {isLoading && !hasData ? (
        <>
          <LoadingBlock label={loadingLabel} />
          <LoadingBlock label={loadingLabel} />
        </>
      ) : null}

      {!isLoading && error === null && isEmpty ? empty : null}

      {children}
    </div>
  );
}

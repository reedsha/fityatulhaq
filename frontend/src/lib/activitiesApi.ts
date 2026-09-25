import { request, requestPaginated, type PaginatedResponse } from "@/lib/api";
import type { BoardKey, ModerationStatus } from "@/lib/webboardApi";

/**
 * Profile-activity and notification transport (§5.4.5 + §3.3).
 *
 * Thin by design, like `webboardApi` and `profileApi`: session handling and
 * envelope unwrapping live in `lib/api`, so this module only names the endpoints
 * and the shapes they speak.
 *
 * The types mirror `backend/src/types/index.ts` field for field. `MyThread`
 * mirrors `MyThreadView` and carries no `author` — the reader *is* the author —
 * and, unlike the public thread summaries, it includes PENDING and REJECTED rows
 * because §7.1 routes an author's view of their own unreviewed question here.
 */

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** §5.4.5 — the activity tabs. Home of the header's "กิจกรรมของฉัน" entry. */
export const ACTIVITIES_PATH = "/profile/activities";

/**
 * §3.3 — the header bell navigates straight to the notifications tab, and the tab
 * is URL-addressed, so the deep link is a single constant rather than a string
 * built at the call site (where a typo would silently land on the default tab).
 */
export const ACTIVITIES_TAB_PARAM = "tab";
export const NOTIFICATIONS_TAB = "notifications";
export const NOTIFICATIONS_PATH = `${ACTIVITIES_PATH}?${ACTIVITIES_TAB_PARAM}=${NOTIFICATIONS_TAB}`;

/** Why a notification exists; mirrors the backend `NotificationType` enum. */
export const NOTIFICATION_TYPES = {
  YOUTH_CARE_ANSWERED: "YOUTH_CARE_ANSWERED",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export interface NotificationThreadRef {
  id: string;
  board: BoardKey;
  title: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  /** Null while unread; the bell counts the nulls. */
  readAt: string | null;
  createdAt: string;
  thread: NotificationThreadRef;
}

export interface MyThread {
  id: string;
  board: BoardKey;
  title: string;
  excerpt: string;
  moderation: ModerationStatus;
  /** Why a moderator rejected or hid it; null unless someone did (§7.1). */
  moderationNote: string | null;
  isAnswered: boolean;
  commentCount: number;
  likeCount: number;
  createdAt: string;
}

export interface MyComment {
  id: string;
  threadId: string;
  threadTitle: string;
  board: BoardKey;
  excerpt: string;
  moderation: ModerationStatus;
  moderationNote: string | null;
  isOfficial: boolean;
  likeCount: number;
  createdAt: string;
}

export interface ReadNotificationResult {
  id: string;
  readAt: string;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** §5.4.5 — the caller's own threads. `page` is 1-based; the backend clamps. */
export async function fetchMyThreads(
  page: number,
  signal?: AbortSignal,
): Promise<PaginatedResponse<MyThread[]>> {
  return requestPaginated<MyThread[]>(`/webboard/me/threads?page=${page}`, { signal });
}

/** §5.4.5 — the caller's own replies. */
export async function fetchMyComments(
  page: number,
  signal?: AbortSignal,
): Promise<PaginatedResponse<MyComment[]>> {
  return requestPaginated<MyComment[]>(`/webboard/me/comments?page=${page}`, { signal });
}

/** §5.4.5 — the notifications tab. */
export async function fetchNotifications(
  page: number,
  signal?: AbortSignal,
): Promise<PaginatedResponse<NotificationItem[]>> {
  return requestPaginated<NotificationItem[]>(`/notifications?page=${page}`, { signal });
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** §5.4.5 — mark one notification read. Idempotent on the server. */
export async function markNotificationRead(
  notificationId: string,
): Promise<ReadNotificationResult> {
  return request<ReadNotificationResult>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );
}

import { request } from "@/lib/api";

/**
 * Notification source for the header's bell (§3.3).
 *
 * Reads `GET /notifications/unread-count`, which is member-only — and the bell
 * only ever renders inside the signed-in account menu, so there is no guest path
 * to serve. Failures propagate: `AccountMenu` already treats a failed count as
 * "render the bell without its dot", and swallowing here as well would leave two
 * places deciding what a failure means.
 *
 * Previously a hardcoded placeholder (debt D18, `PLACEHOLDER_UNREAD_NOTIFICATION_COUNT`);
 * the real endpoint arrived with M5's notifications work, which also produces the
 * rows (debt D22). The list itself belongs to the notifications tab and lives in
 * `lib/activitiesApi.ts`; this module answers only the one question the bell asks,
 * because the header renders a count and never a feed.
 */

export async function getUnreadNotificationCount(): Promise<number> {
  const payload = await request<{ count: number }>("/notifications/unread-count");

  return payload.count;
}

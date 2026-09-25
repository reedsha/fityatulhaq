/**
 * Notification source for the header's bell (§3.3, §5.4.5).
 *
 * ⚠️ PLACEHOLDER — Web 1 has no notifications endpoint yet. The profile
 * activities tab that will list them, and the thread-level notification controls
 * that will produce them, arrive with M5; the Web 2 sync lands in M6. Until then
 * this module stands in for the API so the bell and its unread indicator can be
 * built and reviewed.
 *
 * To wire the real thing: replace the body of `getUnreadNotificationCount` with
 * a `GET /notifications/unread-count` request and delete
 * `PLACEHOLDER_UNREAD_NOTIFICATION_COUNT` (debt D18).
 *
 * It returns a count rather than a list on purpose: the header only ever renders
 * the badge, and the list belongs to the notifications tab that owns it.
 */

/** Mock unread total. Deliberately non-zero so the indicator path is visible. */
export const PLACEHOLDER_UNREAD_NOTIFICATION_COUNT = 2;

export async function getUnreadNotificationCount(): Promise<number> {
  return PLACEHOLDER_UNREAD_NOTIFICATION_COUNT;
}

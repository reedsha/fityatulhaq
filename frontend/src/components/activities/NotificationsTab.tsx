"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import {
  CARD_CLASSES,
  EmptyState,
  Pager,
  QUIET_BUTTON_CLASSES,
  WEBBOARD_LINK_CLASSES,
  totalPagesOf,
} from "@/components/webboard/webboardUi";
import { useWebboardResource } from "@/hooks/useWebboardResource";
import {
  NOTIFICATION_TYPES,
  fetchNotifications,
  markNotificationRead,
  type NotificationItem,
  type NotificationType,
} from "@/lib/activitiesApi";
import { resolveUnknownError } from "@/lib/errorMessages";
import { timeAgo } from "@/lib/validation";
import { threadPath } from "@/lib/webboardApi";

import { ActivityList } from "./activitiesUi";

/**
 * §5.4.5 — "การแจ้งเตือน".
 *
 * The header bell counts unread notifications from a separate fetch, so marking
 * one read here reloads this list afterwards; that is the best a single page can
 * do to let the bell catch up on the next navigation, since there is no shared
 * notification store to push into.
 *
 * Reads are marked optimistically: the dot disappears at once, and a failure
 * reverts the row and announces the Thai message from `resolveUnknownError`.
 * Local overrides are keyed by id and dropped as soon as a fresh page confirms
 * the server agrees, so the list never argues with itself.
 */

const NOTIFICATION_MESSAGES: Record<NotificationType, string> = {
  [NOTIFICATION_TYPES.YOUTH_CARE_ANSWERED]: "ทีมงานตอบคำถามของคุณแล้ว",
};

export function NotificationsTab({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (next: number) => void;
}): ReactElement {
  const resource = useWebboardResource(
    (signal) => fetchNotifications(page, signal),
    `notifications|${page}`,
  );

  const [readOverrides, setReadOverrides] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Drop an override once the server's own `readAt` reflects it, so local state
  // stays a thin patch over the fetched page rather than a competing source.
  useEffect((): void => {
    const items = resource.data?.data;

    if (items === undefined) {
      return;
    }

    setReadOverrides((current) => {
      const next: Record<string, string> = {};
      let changed = false;

      for (const [id, readAt] of Object.entries(current)) {
        const fresh = items.find((item) => item.id === id);

        if (fresh !== undefined && fresh.readAt !== null) {
          changed = true;
          continue;
        }

        next[id] = readAt;
      }

      return changed ? next : current;
    });
  }, [resource.data]);

  const notifications = resource.data?.data ?? [];
  const totalPages = totalPagesOf(resource.data?.pagination ?? null);

  const reload = resource.reload;

  const handleMarkRead = useCallback(
    async (id: string): Promise<void> => {
      setErrorMessage(null);
      setPendingId(id);
      setReadOverrides((current) => ({ ...current, [id]: new Date().toISOString() }));

      try {
        const result = await markNotificationRead(id);
        setReadOverrides((current) => ({ ...current, [id]: result.readAt }));
        reload();
      } catch (error) {
        setReadOverrides((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        setErrorMessage(resolveUnknownError(error).message);
      } finally {
        setPendingId(null);
      }
    },
    [reload],
  );

  return (
    <div className="space-y-6">
      {/* Kept mounted so a failure that appears later is still announced. */}
      <div aria-live="polite" role="status">
        {errorMessage !== null ? (
          <p className="rounded-lg bg-state-error-50 px-3 py-2 text-caption text-state-error-700">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <ActivityList
        isLoading={resource.isLoading}
        hasData={resource.data !== null}
        error={resource.error}
        isEmpty={notifications.length === 0}
        onRetry={reload}
        loadingLabel="กำลังโหลดการแจ้งเตือน"
        liveMessage={
          resource.isLoading
            ? "กำลังโหลดการแจ้งเตือน"
            : `พบ ${notifications.length} การแจ้งเตือน`
        }
        empty={
          <EmptyState
            title="ไม่มีการแจ้งเตือน"
            description="ระบบจะแจ้งเตือนคุณเมื่อทีมงานตอบคำถามของคุณในบอร์ดดูแลเยาวชน"
          />
        }
      >
        {notifications.length > 0 ? (
          <ul className="space-y-4">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <NotificationCard
                  notification={notification}
                  isRead={
                    readOverrides[notification.id] !== undefined ||
                    notification.readAt !== null
                  }
                  isPending={pendingId === notification.id}
                  onMarkRead={handleMarkRead}
                />
              </li>
            ))}
          </ul>
        ) : null}

        <Pager page={page} totalPages={totalPages} onChange={onPageChange} />
      </ActivityList>
    </div>
  );
}

function NotificationCard({
  notification,
  isRead,
  isPending,
  onMarkRead,
}: {
  notification: NotificationItem;
  isRead: boolean;
  isPending: boolean;
  onMarkRead: (id: string) => Promise<void>;
}): ReactElement {
  return (
    <article className={CARD_CLASSES}>
      <div className="space-y-2">
        {isRead ? null : (
          <p className="inline-flex items-center gap-1.5 text-caption font-semibold text-state-error-700">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-state-error-500" />
            ยังไม่ได้อ่าน
          </p>
        )}

        <p className="text-body-sm text-ink-800">{NOTIFICATION_MESSAGES[notification.type]}</p>
      </div>

      <p className="mt-1 text-body-sm">
        <Link
          href={threadPath(notification.thread.board, notification.thread.id)}
          className={WEBBOARD_LINK_CLASSES}
        >
          {notification.thread.title}
        </Link>
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-3">
        <time dateTime={notification.createdAt} className="text-caption text-ink-500">
          {timeAgo(notification.createdAt)}
        </time>

        {isRead ? null : (
          <button
            type="button"
            disabled={isPending}
            onClick={(): void => {
              void onMarkRead(notification.id);
            }}
            className={QUIET_BUTTON_CLASSES}
          >
            ทำเครื่องหมายว่าอ่านแล้ว
          </button>
        )}
      </div>
    </article>
  );
}

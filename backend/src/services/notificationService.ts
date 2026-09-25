import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma/client";
import { createAppError } from "../middleware/errorFormatter";
import {
  NOTIFICATION_TYPES,
  type BoardKey,
  type NotificationTypeValue,
  type NotificationView,
  type ReadNotificationView,
} from "../types";

/**
 * Notifications — §3.3 (the header bell) and §5.4.5 (the notifications tab).
 *
 * Web 1 has exactly one producer today: the Youth Care team posting the official
 * answer to a member's question (§5.3.2 promises "รับการแจ้งเตือนเมื่อมีคนตอบ",
 * tracked as debt D22). The two halves live here together on purpose —
 * `createYouthCareAnsweredNotification` is called inside the answer's own
 * transaction, and `listNotifications`/`countUnread` read the same table — so a
 * change to how a notification is written cannot drift from how it is read.
 *
 * The enum has one value; adding a producer means adding a value and a helper,
 * never reshaping the table (debt D18 records the Web 2 side).
 */

/** The small slice of `Post` a notification needs to render a link. */
const THREAD_SELECT = { id: true, board: true, title: true } as const;

interface NotificationRow {
  id: string;
  type: NotificationTypeValue;
  readAt: Date | null;
  createdAt: Date;
  post: { id: string; board: BoardKey; title: string };
}

function toNotificationView(row: NotificationRow): NotificationView {
  return {
    id: row.id,
    type: row.type,
    readAt: row.readAt === null ? null : row.readAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    thread: { id: row.post.id, board: row.post.board, title: row.post.title },
  };
}

// ---------------------------------------------------------------------------
// Producer
// ---------------------------------------------------------------------------

export interface YouthCareAnsweredInput {
  postId: string;
  /** The member who asked — the notification's owner. */
  recipientId: string;
  /** The moderator whose answer triggered it. */
  actorId: string;
}

/**
 * Writes the "ทีมงานตอบแล้ว" notification, inside the caller's transaction.
 *
 * Takes a `TransactionClient` rather than using `prisma` directly so it lands in
 * the same commit as the answer and the `answeredAt` stamp: a notification for
 * an answer that rolled back would be a lie the feed could not retract.
 *
 * Answering your own question is not news, so that case writes nothing. The
 * guard is here rather than at the call site so every future caller inherits it.
 */
export async function createYouthCareAnsweredNotification(
  tx: Prisma.TransactionClient,
  input: YouthCareAnsweredInput,
): Promise<void> {
  if (input.recipientId === input.actorId) {
    return;
  }

  await tx.notification.create({
    data: {
      userId: input.recipientId,
      type: NOTIFICATION_TYPES.YOUTH_CARE_ANSWERED,
      postId: input.postId,
    },
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface ListNotificationsInput {
  userId: string;
  skip: number;
  take: number;
}

export interface ListNotificationsResult {
  notifications: NotificationView[];
  total: number;
}

/**
 * One page of the caller's own notifications, newest first.
 *
 * Both the page and the total are scoped to `userId`, so a signed-in member can
 * only ever page through their own feed — there is no id in the query to guess.
 */
export async function listNotifications(
  input: ListNotificationsInput,
): Promise<ListNotificationsResult> {
  const where = { userId: input.userId };

  const [rows, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: input.skip,
      take: input.take,
      select: {
        id: true,
        type: true,
        readAt: true,
        createdAt: true,
        post: { select: THREAD_SELECT },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications: rows.map(toNotificationView), total };
}

/** §3.3 — what the bell's red dot counts. */
export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

// ---------------------------------------------------------------------------
// Mark read
// ---------------------------------------------------------------------------

/**
 * Marks one of the caller's notifications read.
 *
 * Scoped by `userId`, and a row that is not the caller's is a 404 rather than a
 * 403: whether an id exists is not the caller's business, so the two must not
 * be distinguishable. Idempotent — reading an already-read row returns its
 * original timestamp instead of moving it.
 */
export async function markRead(
  userId: string,
  notificationId: string,
): Promise<ReadNotificationView> {
  const row = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, readAt: true },
  });

  if (row === null) {
    throw createAppError("NOTIFICATION_NOT_FOUND", "Notification not found", 404);
  }

  if (row.readAt !== null) {
    return { id: row.id, readAt: row.readAt.toISOString() };
  }

  const readAt = new Date();

  await prisma.notification.update({
    where: { id: row.id },
    data: { readAt },
  });

  return { id: row.id, readAt: readAt.toISOString() };
}

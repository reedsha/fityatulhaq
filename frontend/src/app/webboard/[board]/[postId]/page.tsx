import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import { ThreadDetail } from "@/components/webboard/ThreadDetail";
import { BOARD_META, boardFromSegment } from "@/lib/webboardApi";

/**
 * `/webboard/[board]/[postId]` — SRS §5.3.4.
 *
 * The board segment is resolved on the server so an unknown one is a real 404
 * rather than a client-side error state, and the board key is then passed down
 * typed — the thread view never re-derives it from a string.
 *
 * A thread that is pending, rejected or hidden answers 404 from the API too
 * (§7.1 keeps the pre-moderation gate from leaking unreviewed content), which
 * `ThreadDetail` renders as a "not found" state with a way back.
 */
interface ThreadPageProps {
  params: Promise<{ board: string; postId: string }>;
}

export async function generateMetadata({ params }: ThreadPageProps): Promise<Metadata> {
  const { board } = await params;
  const boardKey = boardFromSegment(board);

  return {
    title: boardKey === null ? "ไม่พบกระทู้" : BOARD_META[boardKey].title,
  };
}

export default async function ThreadPage({ params }: ThreadPageProps): Promise<ReactElement> {
  const { board, postId } = await params;
  const boardKey = boardFromSegment(board);

  if (boardKey === null) {
    notFound();
  }

  const meta = BOARD_META[boardKey];

  return (
    <AuthAwareShell title={meta.title} description={meta.description}>
      <ThreadDetail board={boardKey} postId={postId} />
    </AuthAwareShell>
  );
}

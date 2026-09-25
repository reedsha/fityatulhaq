import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import { NewThreadForm } from "@/components/webboard/NewThreadForm";
import { NEW_THREAD_PATH, boardFromKey } from "@/lib/webboardApi";

export const metadata: Metadata = {
  title: "ตั้งกระทู้ใหม่",
  description: "เริ่มกระทู้ใหม่ในบอร์ดสนทนาของ FityatulHaq",
};

interface NewThreadPageProps {
  /** Next 15 hands `searchParams` as a promise; `?board=` preselects a board. */
  searchParams: Promise<{ board?: string | string[] }>;
}

/**
 * `/webboard/new` — the destination of every "ตั้งกระทู้ใหม่" / "ตั้งคำถามใหม่"
 * button (§5.3.1–§5.3.3), and therefore the page a guest reaches through
 * `/login?next=/webboard/new…`.
 *
 * The board arrives as a query value rather than a route segment so one form
 * serves both entry points, and `requireAuth` + `returnTo` means a guest who
 * lands here directly still comes back to this form after signing in.
 */
export default async function NewThreadPage({
  searchParams,
}: NewThreadPageProps): Promise<ReactElement> {
  const params = await searchParams;
  const initialBoard = boardFromKey(typeof params.board === "string" ? params.board : null);

  return (
    <AuthAwareShell
      title="ตั้งกระทู้ใหม่"
      description="เลือกบอร์ด แล้วเขียนหัวข้อกับรายละเอียดที่คุณต้องการแบ่งปัน"
      requireAuth
      returnTo={NEW_THREAD_PATH}
    >
      <NewThreadForm initialBoard={initialBoard} />
    </AuthAwareShell>
  );
}

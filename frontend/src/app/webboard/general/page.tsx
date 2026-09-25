import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import { BoardThreadList } from "@/components/webboard/BoardThreadList";
import { BOARD_META, BOARDS } from "@/lib/webboardApi";

export const metadata: Metadata = {
  title: BOARD_META[BOARDS.GENERAL].title,
  description: BOARD_META[BOARDS.GENERAL].description,
};

/**
 * `/webboard/general` — SRS §5.3.3. Post-moderation: threads appear immediately
 * and the team acts on reports (§7.2), which is why this board carries tags and
 * the latest/popular/most-replied sort rather than a status toggle.
 */
export default function GeneralDiscussionPage(): ReactElement {
  const meta = BOARD_META[BOARDS.GENERAL];

  return (
    <AuthAwareShell title={meta.title} description={meta.description}>
      <BoardThreadList board={meta.key} />
    </AuthAwareShell>
  );
}

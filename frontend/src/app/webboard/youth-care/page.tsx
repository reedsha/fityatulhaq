import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import { BoardThreadList } from "@/components/webboard/BoardThreadList";
import { BOARD_META, BOARDS } from "@/lib/webboardApi";

export const metadata: Metadata = {
  title: BOARD_META[BOARDS.YOUTH_CARE].title,
  description: BOARD_META[BOARDS.YOUTH_CARE].description,
};

/**
 * `/webboard/youth-care` — SRS §5.3.2. Read is public; asking is member-only and
 * every new question waits for review (§7.1). The board's own rules — anonymity,
 * pre-moderation, the status toggle — come from `BOARD_META`, so this page and
 * the hub cannot describe it differently.
 */
export default function YouthCareForumPage(): ReactElement {
  const meta = BOARD_META[BOARDS.YOUTH_CARE];

  return (
    <AuthAwareShell title={meta.title} description={meta.description}>
      <BoardThreadList board={meta.key} />
    </AuthAwareShell>
  );
}

"use client";

import { Plus, VenetianMask } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";

import { useWebboardResource } from "@/hooks/useWebboardResource";
import {
  BOARD_META,
  BOARD_ORDER,
  NEW_THREAD_PATH,
  boardPath,
  fetchOverview,
  fetchTags,
  type BoardOverview,
  type BoardTag,
} from "@/lib/webboardApi";

import {
  CARD_CLASSES,
  EmptyState,
  ErrorState,
  LoadingBlock,
  MemberActionLink,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  ThreadCard,
} from "./webboardUi";

/**
 * `/webboard` — SRS §5.3.1: the entrance to the two boards, with their activity
 * and the most recent threads across both.
 *
 * The "ตั้งกระทู้ใหม่" button is a `MemberActionLink`, so it is a plain link for
 * a member and a link through `/login?next=…` for a guest — the PRD's
 * "นำไปหน้า Login หากยังไม่ได้ล็อกอิน" without a dead or misleading button.
 */

interface HubData {
  overview: BoardOverview;
  tags: BoardTag[];
}

export function WebboardHub(): ReactElement {
  const { data, isLoading, error, reload } = useWebboardResource<HubData>(
    async (signal): Promise<HubData> => {
      const [overview, tags] = await Promise.all([fetchOverview(signal), fetchTags(signal)]);

      return { overview, tags };
    },
    "webboard-hub",
  );

  const tagLabels: Record<string, string> = {};

  for (const tag of data?.tags ?? []) {
    tagLabels[tag.slug] = tag.label;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-body-sm text-ink-600">
          ทุกบอร์ดเปิดให้อ่านได้โดยไม่ต้องเข้าสู่ระบบ การตั้งกระทู้ ตอบกลับ และกดถูกใจต้องเป็นสมาชิก
        </p>

        <MemberActionLink returnTo={NEW_THREAD_PATH} className={PRIMARY_BUTTON_CLASSES}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          ตั้งกระทู้ใหม่
        </MemberActionLink>
      </div>

      {error !== null ? <ErrorState message={error} onRetry={reload} /> : null}

      {isLoading && data === null ? (
        <>
          <LoadingBlock label="กำลังโหลดบอร์ด" />
          <LoadingBlock label="กำลังโหลดกระทู้ล่าสุด" />
        </>
      ) : null}

      {data !== null ? (
        <>
          <section aria-label="บอร์ดทั้งหมด" className="grid gap-4 md:grid-cols-2">
            {BOARD_ORDER.map((key) => {
              const meta = BOARD_META[key];
              const summary = data.overview.boards.find((board) => board.key === key);

              return (
                <article key={key} className={CARD_CLASSES}>
                  <h2 className="text-heading-3 text-ink-900">
                    <Link
                      href={boardPath(key)}
                      className="rounded underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                    >
                      {meta.title}
                    </Link>
                  </h2>

                  <p className="mt-2 text-body-sm text-ink-600">{meta.cardBlurb}</p>

                  {meta.isAnonymous ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-caption text-ink-500">
                      <VenetianMask aria-hidden="true" className="h-3.5 w-3.5" />
                      ทุกคำถามแสดงแบบไม่เปิดเผยตัวตน และผ่านการตรวจสอบก่อนเผยแพร่
                    </p>
                  ) : null}

                  <dl className="mt-4 flex flex-wrap gap-5 text-caption text-ink-600">
                    <div>
                      <dt className="inline">กระทู้ </dt>
                      <dd className="inline font-semibold text-ink-900">
                        {summary?.threadCount ?? 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline">ความคิดเห็น </dt>
                      <dd className="inline font-semibold text-ink-900">
                        {summary?.commentCount ?? 0}
                      </dd>
                    </div>
                  </dl>

                  <Link href={boardPath(key)} className={`mt-5 ${SECONDARY_BUTTON_CLASSES}`}>
                    เข้าสู่บอร์ด
                  </Link>
                </article>
              );
            })}
          </section>

          <section aria-label="กระทู้ล่าสุด" className="space-y-4">
            <h2 className="text-heading-3 text-ink-900">กระทู้ล่าสุด</h2>

            {data.overview.latestThreads.length === 0 ? (
              <EmptyState
                title="ยังไม่มีกระทู้ในเว็บบอร์ด"
                description="กระทู้จะปรากฏขึ้นเมื่อสมาชิกเริ่มตั้งกระทู้"
              />
            ) : (
              <ul className="space-y-4">
                {data.overview.latestThreads.map((thread) => (
                  <li key={thread.id}>
                    <ThreadCard thread={thread} showBoardBadge labels={tagLabels} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

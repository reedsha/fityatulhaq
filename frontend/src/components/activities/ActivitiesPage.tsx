"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";

import { FOCUS_RING } from "@/components/layout/Header";
import { EmptyState, LoadingBlock } from "@/components/webboard/webboardUi";

import { MyCommentsTab } from "./MyCommentsTab";
import { MyThreadsTab } from "./MyThreadsTab";
import { NotificationsTab } from "./NotificationsTab";

/**
 * `/profile/activities` (§5.4.5), composed of four tabs:
 *
 *  - "กระทู้ของฉัน" — the member's own threads and questions, including the
 *    PENDING and REJECTED ones §7.1 shows only to their author.
 *  - "ความคิดเห็นของฉัน" — the member's own replies, each linking back to its
 *    thread.
 *  - "เนื้อหาที่บันทึกไว้" — an honest placeholder. There is deliberately no
 *    bookmark model in the database and nothing in the app can create one, so
 *    this tab calls no endpoint and invents no rows; it says the feature is
 *    coming soon instead of showing a fake list or a dead control.
 *  - "การแจ้งเตือน" — the member's notifications, markable as read.
 *
 * Tab state is URL-synced through `?tab=` so a tab is shareable and survives a
 * reload. `useSearchParams` is wrapped in a `Suspense` boundary below, which is
 * what a statically prerendered route requires; the fallback is the shared
 * loading block rather than an empty flash.
 *
 * The tablist implements the APG tab pattern in full — `role="tab"` with
 * `aria-selected`, a roving `tabIndex`, and Arrow/Home/End keys that move
 * selection and focus — so the roles are honoured rather than half-declared.
 */

type ActivityTabKey = "threads" | "comments" | "bookmarks" | "notifications";

interface ActivityTab {
  key: ActivityTabKey;
  label: string;
}

const ACTIVITY_TABS: readonly ActivityTab[] = [
  { key: "threads", label: "กระทู้ของฉัน" },
  { key: "comments", label: "ความคิดเห็นของฉัน" },
  { key: "bookmarks", label: "เนื้อหาที่บันทึกไว้" },
  { key: "notifications", label: "การแจ้งเตือน" },
];

const DEFAULT_TAB: ActivityTabKey = "threads";

const TAB_BASE = `rounded-full px-4 py-2 text-caption font-semibold transition duration-fast ease-standard motion-reduce:transition-none ${FOCUS_RING}`;
const TAB_ACTIVE = "bg-brand-600 text-white";
const TAB_IDLE = "bg-surface-sunken text-ink-600 hover:bg-ink-100 hover:text-ink-900";

function tabId(key: ActivityTabKey): string {
  return `activity-tab-${key}`;
}

function panelId(key: ActivityTabKey): string {
  return `activity-panel-${key}`;
}

/** Absent or unknown `?tab=` values fall back to the first tab. */
function resolveTab(value: string | null): ActivityTabKey {
  const match = ACTIVITY_TABS.find((tab) => tab.key === value);
  return match?.key ?? DEFAULT_TAB;
}

export function ActivitiesPage(): ReactElement {
  return (
    <Suspense fallback={<LoadingBlock label="กำลังโหลดกิจกรรมของคุณ" />}>
      <ActivitiesView />
    </Suspense>
  );
}

function ActivitiesView(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = resolveTab(searchParams.get("tab"));
  const [page, setPage] = useState(1);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // A browser Back/Forward that changes `?tab=` reaches this component without
  // going through `selectTab`, so the page number has to be reset here too —
  // otherwise the newly shown tab opens on the previous tab's page.
  useEffect((): void => {
    setPage(1);
  }, [activeTab]);

  const selectTab = useCallback(
    (next: ActivityTabKey): void => {
      // Every tab starts at page 1; carrying a page across would ask the next
      // list for a page it may not have.
      setPage(1);

      const params = new URLSearchParams(searchParams.toString());

      if (next === DEFAULT_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", next);
      }

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
      let nextIndex: number;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % ACTIVITY_TABS.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + ACTIVITY_TABS.length) % ACTIVITY_TABS.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = ACTIVITY_TABS.length - 1;
      } else {
        return;
      }

      event.preventDefault();

      const nextTab = ACTIVITY_TABS[nextIndex];

      if (nextTab === undefined) {
        return;
      }

      selectTab(nextTab.key);
      tabRefs.current[nextIndex]?.focus();
    },
    [selectTab],
  );

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="หมวดกิจกรรม" className="flex flex-wrap items-center gap-2">
        {ACTIVITY_TABS.map((tab, index) => {
          const isSelected = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              ref={(node): void => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={tabId(tab.key)}
              aria-controls={panelId(tab.key)}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={(): void => {
                selectTab(tab.key);
              }}
              onKeyDown={(event): void => {
                handleTabKeyDown(event, index);
              }}
              className={`${TAB_BASE} ${isSelected ? TAB_ACTIVE : TAB_IDLE}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId(activeTab)}
        aria-labelledby={tabId(activeTab)}
        // APG: a panel whose content is not focusable needs `tabindex="0"` so a
        // keyboard user can reach and read it. The bookmarks tab is the only one
        // with no links or buttons; the rest already have focusable children, and
        // landing on the panel first would just be an extra tab stop.
        tabIndex={activeTab === "bookmarks" ? 0 : undefined}
      >
        {activeTab === "threads" ? (
          <MyThreadsTab page={page} onPageChange={setPage} />
        ) : null}

        {activeTab === "comments" ? (
          <MyCommentsTab page={page} onPageChange={setPage} />
        ) : null}

        {activeTab === "bookmarks" ? <BookmarksPanel /> : null}

        {activeTab === "notifications" ? (
          <NotificationsTab page={page} onPageChange={setPage} />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Honest empty state for "เนื้อหาที่บันทึกไว้": no model, no endpoint, no rows.
 * Saving favourite content is not implemented anywhere in the app, so this tab
 * says so plainly rather than pretending.
 */
function BookmarksPanel(): ReactElement {
  return (
    <EmptyState
      title="ยังไม่มีเนื้อหาที่บันทึกไว้"
      description="การบันทึกกระทู้และเนื้อหาที่สนใจไว้ดูภายหลังเป็นฟีเจอร์ที่กำลังจะมาเร็ว ๆ นี้"
    />
  );
}

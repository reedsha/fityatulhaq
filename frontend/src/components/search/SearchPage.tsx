"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { FOCUS_RING } from "@/components/layout/Header";
import {
  CARD_CLASSES,
  EmptyState,
  FIELD_CLASSES,
  QUIET_BUTTON_CLASSES,
  WEBBOARD_LINK_CLASSES,
} from "@/components/webboard/webboardUi";
import { useAuth } from "@/context/AuthContext";
import { loginReturnHref } from "@/lib/memberGate";
import {
  MIN_SEARCH_QUERY_LENGTH,
  SEARCH_TYPE_LABELS,
  SEARCH_TYPE_ORDER,
  countResults,
  searchContent,
  type SearchEntry,
  type SearchType,
} from "@/lib/searchIndex";

/**
 * Unified site search (§5.2.12).
 *
 * **Why the search is client-side.** Every searchable item lives in a plain,
 * server-safe mock module under `@/lib` (`newsData`, `knowledgeItemsData`, …) and
 * the backend has no content tables at all, so there is no endpoint to query.
 * `searchContent` builds its index from those modules at load and filters it
 * synchronously, which also keeps `/search` reachable without a session — the
 * page is public, so a typed search must never require one.
 *
 * The input's raw value is debounced into a separate `query` state so a keystroke
 * does not re-filter the whole index on every character; `searchContent` only ever
 * sees the settled value, and both states start empty so the server render and the
 * first client render agree.
 */

/** Long enough to skip mid-word keystrokes, short enough that typing still feels live. */
const DEBOUNCE_MS = 300;

/** The board list's chip recipe, reused verbatim so the two chip rows cannot drift. */
const FILTER_CHIP_CLASSES =
  "rounded-full border px-3.5 py-1.5 text-caption font-medium transition duration-fast ease-standard motion-reduce:transition-none";
const FILTER_CHIP_ACTIVE = "border-brand-600 bg-brand-600 text-white";
const FILTER_CHIP_IDLE =
  "border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-700";

const SEARCH_INPUT_ID = "site-search";

export default function SearchPage(): ReactElement {
  const { isAuthenticated, isLoading } = useAuth();

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [includedTypes, setIncludedTypes] = useState<Set<SearchType>>(
    () => new Set(SEARCH_TYPE_ORDER),
  );

  // Mirror the raw value into `query` only once typing has paused.
  useEffect((): (() => void) => {
    const timer = window.setTimeout((): void => {
      setQuery(rawQuery);
    }, DEBOUNCE_MS);

    return (): void => {
      window.clearTimeout(timer);
    };
  }, [rawQuery]);

  const toggleType = useCallback((type: SearchType): void => {
    setIncludedTypes((current) => {
      const next = new Set(current);

      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }

      return next;
    });
  }, []);

  const resetTypes = useCallback((): void => {
    setIncludedTypes(new Set(SEARCH_TYPE_ORDER));
  }, []);

  const groups = useMemo(
    () => searchContent(query, Array.from(includedTypes)),
    [query, includedTypes],
  );
  const resultCount = useMemo(() => countResults(groups), [groups]);

  // `searchContent` treats a short query as "nothing asked", so the idle prompt is
  // keyed off the same threshold rather than off the (always empty) result list.
  const trimmedQuery = query.trim();
  const isQueryValid = trimmedQuery.length >= MIN_SEARCH_QUERY_LENGTH;
  const isNarrowed = includedTypes.size < SEARCH_TYPE_ORDER.length;

  const announcement = !isQueryValid
    ? ""
    : resultCount > 0
      ? `พบ ${resultCount} ผลลัพธ์`
      : "ไม่พบผลลัพธ์";

  // §6.4 — a member-only row is still listed; a settled signed-out visitor is sent
  // through the login return flow instead. While the session is being restored the
  // plain href renders, so nothing claims a membership the server has not confirmed.
  const linkHref = (entry: SearchEntry): string =>
    entry.membersOnly && !isLoading && !isAuthenticated
      ? loginReturnHref(entry.href)
      : entry.href;

  let emptyDescription = "กรุณาลองใช้คำค้นอื่น หรือตรวจสอบการสะกดคำ";

  if (includedTypes.size === 0) {
    emptyDescription =
      "ยังไม่ได้เลือกประเภทเนื้อหา กรุณาเลือกอย่างน้อยหนึ่งประเภท หรือกดล้างตัวกรอง";
  } else if (isNarrowed) {
    emptyDescription = "กรุณาลองใช้คำค้นอื่น หรือกดล้างตัวกรองเพื่อค้นหาในทุกประเภท";
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          ค้นหา
        </label>

        <input
          id={SEARCH_INPUT_ID}
          type="search"
          value={rawQuery}
          autoComplete="off"
          placeholder="พิมพ์คำค้น เช่น ค่าย หรือ สารานุกรม"
          onChange={(event): void => {
            setRawQuery(event.target.value);
          }}
          className={FIELD_CLASSES}
        />

        {isQueryValid ? null : (
          <p className="mt-2 text-caption text-ink-500">
            กรุณาพิมพ์อย่างน้อย 2 ตัวอักษรเพื่อเริ่มค้นหา
          </p>
        )}
      </div>

      <nav aria-label="ตัวกรองประเภทเนื้อหา" className="space-y-3">
        <ul className="flex flex-wrap items-center gap-2">
          {SEARCH_TYPE_ORDER.map((type) => {
            const included = includedTypes.has(type);

            return (
              <li key={type}>
                <button
                  type="button"
                  aria-pressed={included}
                  onClick={(): void => {
                    toggleType(type);
                  }}
                  className={`${FILTER_CHIP_CLASSES} ${included ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE} ${FOCUS_RING}`}
                >
                  {SEARCH_TYPE_LABELS[type]}
                </button>
              </li>
            );
          })}
        </ul>

        {isNarrowed ? (
          <button type="button" onClick={resetTypes} className={QUIET_BUTTON_CLASSES}>
            ล้างตัวกรอง
          </button>
        ) : null}
      </nav>

      {/* The results region swaps in place; this announces the change. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {!isQueryValid ? (
        <EmptyState
          title="เริ่มค้นหา"
          description="ค้นหาได้ทุกหมวดหมู่จากจุดเดียว ทั้งข่าวสาร ประกาศ หลักสูตร หนังสือ วิดีโอ และอื่น ๆ กรุณาพิมพ์อย่างน้อย 2 ตัวอักษร"
        />
      ) : resultCount === 0 ? (
        <EmptyState title="ไม่พบผลลัพธ์" description={emptyDescription} />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.type} aria-label={group.label} className="space-y-3">
              <h2 className="text-heading-3 text-ink-900">
                {group.label}
                <span className="ml-2 text-caption font-medium text-ink-500">
                  {group.total > group.items.length
                    ? `แสดง ${group.items.length} จาก ${group.total} รายการ`
                    : `${group.total} รายการ`}
                </span>
              </h2>

              <ul className="space-y-3">
                {group.items.map((entry) => (
                  <li key={`${entry.type}:${entry.id}`}>
                    <article className={`${CARD_CLASSES} space-y-2`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-caption font-semibold text-brand-800">
                          {group.label}
                        </span>

                        {entry.membersOnly ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-state-warning-100 px-2.5 py-1 text-caption font-semibold text-state-warning-700">
                            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                            เนื้อหาสมาชิก
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-heading-4">
                        <Link href={linkHref(entry)} className={WEBBOARD_LINK_CLASSES}>
                          {entry.title}
                        </Link>
                      </h3>

                      <p className="text-body-sm text-ink-600">{entry.snippet}</p>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

import type { ReactElement, ReactNode } from "react";

/**
 * Shared presentation for the two static legal pages (§5.5.1 privacy policy and
 * §5.5.2 terms of use).
 *
 * Both pages are pure server components with no API calls, and both are the same
 * shape: a stack of titled sections over body copy. One helper keeps their
 * headings, rhythm and link treatment identical, so the two documents cannot
 * drift apart typographically — and it means the section anchors used by the
 * in-page contents list are generated the same way on both.
 */

export interface LegalSectionProps {
  /** Anchor id, referenced by the page's contents list and `aria-labelledby`. */
  id: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ id, title, children }: LegalSectionProps): ReactElement {
  return (
    <section aria-labelledby={`${id}-heading`} id={id} className="scroll-mt-24">
      <h2 id={`${id}-heading`} className="text-heading-4 text-ink-900">
        {title}
      </h2>

      <div className="mt-3 space-y-3 text-body leading-relaxed text-ink-700">{children}</div>
    </section>
  );
}

/**
 * A bulleted list of plain-text items.
 *
 * Items are strings rather than nodes so the key is the text itself; nothing in
 * either document needs markup inside a bullet, and a stable key beats an index.
 */
export function LegalList({ items }: { items: readonly string[] }): ReactElement {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-ink-400">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * The "last updated" line every legal document should carry, pinned to a fixed
 * string so it can never render differently on the server and the client.
 */
export function LegalEffectiveDate({ children }: { children: ReactNode }): ReactElement {
  return (
    <p className="rounded-xl border border-ink-200 bg-surface-sunken px-4 py-3 text-body-sm text-ink-600">
      {children}
    </p>
  );
}

/**
 * The in-page contents list at the top of each document.
 *
 * Plain anchors rather than `next/link`: these are same-page fragment jumps, and
 * `Link` adds prefetch behaviour that means nothing for a hash on the current
 * route.
 */
export function LegalContents({
  entries,
}: {
  entries: readonly { id: string; title: string }[];
}): ReactElement {
  return (
    <nav
      aria-label="สารบัญ"
      className="rounded-xl border border-ink-200 bg-surface-raised p-5"
    >
      <h2 className="text-body-sm font-bold uppercase tracking-wider text-ink-600">สารบัญ</h2>

      <ol className="mt-3 space-y-2">
        {entries.map((entry, index) => (
          <li key={entry.id} className="text-body-sm">
            <a
              href={`#${entry.id}`}
              className="text-brand-700 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              {`${index + 1}. ${entry.title}`}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

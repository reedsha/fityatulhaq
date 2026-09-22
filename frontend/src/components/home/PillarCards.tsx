"use client";

import { BookOpen, ClipboardList, Megaphone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";

export type PillarIconType = "megaphone" | "book-open" | "users" | "clipboard-list";

export interface PillarCardData {
  id: string;
  title: string;
  description: string;
  iconType: PillarIconType;
  href?: string;
}

export interface PillarCardsProps {
  pillars: PillarCardData[];
}

const ICONS: Record<PillarIconType, LucideIcon> = {
  megaphone: Megaphone,
  "book-open": BookOpen,
  users: Users,
  "clipboard-list": ClipboardList,
};

const BASE_CARD_CLASSES =
  "h-full rounded-lg border border-ink-200 bg-white p-6 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

/** A 3px left rule appears on hover/focus to mark the card as interactive. */
const HOVER_BORDER_CLASSES = "hover:border-ink-200 hover:shadow-card-hover";

const INTERACTIVE_BORDER_CLASSES =
  "hover:border-l-[3px] hover:border-brand-700 focus-visible:border-l-[3px] focus-visible:border-brand-700";

/**
 * The organisation's four pillars.
 *
 * Cards without a destination render as plain text; a `href` turns the whole
 * card into a link, which keeps the whole surface clickable rather than just
 * the title.
 */
export function PillarCards({ pillars }: PillarCardsProps): ReactElement {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
      {pillars.map((pillar, index) => {
        const Icon = ICONS[pillar.iconType];
        const isLink = pillar.href !== undefined;

        const body = (
          <>
            {Icon === undefined ? null : (
              <Icon className="h-8 w-8 text-brand-700" aria-hidden="true" />
            )}

            <h3 className="mt-4 text-heading-3 text-ink-900">{pillar.title}</h3>

            <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{pillar.description}</p>
          </>
        );

        return (
          <li
            key={pillar.id}
            className="animate-rise-in"
            // Staggered entrance: each card starts a beat after the previous one.
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {isLink ? (
              <a
                href={pillar.href}
                className={`${BASE_CARD_CLASSES} ${HOVER_BORDER_CLASSES} ${INTERACTIVE_BORDER_CLASSES} block cursor-pointer`}
              >
                {body}
              </a>
            ) : (
              <div className={`${BASE_CARD_CLASSES} ${HOVER_BORDER_CLASSES}`}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

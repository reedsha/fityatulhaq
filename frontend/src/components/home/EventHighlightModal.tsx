"use client";

import { CalendarDays, MapPin, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from "react";

export interface HighlightedEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface EventHighlightModalProps {
  event: HighlightedEvent | null;
}

/** Namespaced per event, so a future event is not swallowed by an old dismissal. */
function dismissalKey(eventId: string): string {
  return `event-dismissed-${eventId}`;
}

function readDismissed(eventId: string): boolean {
  try {
    return window.sessionStorage.getItem(dismissalKey(eventId)) !== null;
  } catch (error) {
    // Private-browsing modes refuse storage; treating that as "not dismissed"
    // only means the visitor may see the modal again, never that it is lost.
    console.warn(`Unable to read the dismissal flag for event ${eventId}`, error);
    return false;
  }
}

function writeDismissed(eventId: string): void {
  try {
    window.sessionStorage.setItem(dismissalKey(eventId), "1");
  } catch (error) {
    console.warn(`Unable to record the dismissal flag for event ${eventId}`, error);
  }
}

/** Every focusable control inside the dialog, in DOM order. */
function focusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

/**
 * One-time announcement of an upcoming event.
 *
 * Opens a second after mount, remembers the dismissal for the browsing session,
 * and traps focus while open so keyboard users cannot tab into the page behind
 * it. Renders nothing when there is no event to show.
 */
export function EventHighlightModal({ event }: EventHighlightModalProps): ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect((): (() => void) | undefined => {
    if (event === null) {
      return undefined;
    }

    if (readDismissed(event.id)) {
      return undefined;
    }

    const timer = window.setTimeout((): void => {
      setIsOpen(true);
    }, 1000);

    return (): void => {
      window.clearTimeout(timer);
    };
  }, [event]);

  const close = useCallback((): void => {
    setIsOpen(false);

    if (event !== null) {
      writeDismissed(event.id);
    }

    previouslyFocused.current?.focus();
    previouslyFocused.current = null;
  }, [event]);

  // Focus is moved in an effect rather than with `autoFocus` so the element is
  // guaranteed to be mounted, and so the previous focus is captured first.
  useEffect((): (() => void) | undefined => {
    if (!isOpen || event === null) {
      return undefined;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    return (): void => undefined;
  }, [event, isOpen]);

  useEffect((): (() => void) | undefined => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (dialog === null) {
        return;
      }

      const elements = focusableElements(dialog);
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (first === undefined || last === undefined) {
        return;
      }

      const active = document.activeElement;
      const onFirst = active === first;
      const onLast = active === last;

      if (event.shiftKey && (onFirst || active === dialog)) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && onLast) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  // Body scrolling stops while the dialog is up, so the page behind cannot drift.
  useEffect((): (() => void) | undefined => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return (): void => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (event === null || !isOpen) {
    return null;
  }

  const handleDialogKeyDown = (keyboardEvent: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (keyboardEvent.key === "Escape") {
      keyboardEvent.stopPropagation();
      close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      role="presentation"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-highlight-title"
        tabIndex={-1}
        onClick={(clickEvent): void => clickEvent.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
        className="relative w-full max-w-[480px] rounded-xl bg-white p-6 shadow-floating outline-none animate-pop-in"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close event announcement"
          className="absolute right-3 top-3 rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <p className="inline-flex items-center rounded bg-brand-700 px-2.5 py-1 text-caption font-semibold uppercase tracking-widest text-white">
          Upcoming event
        </p>

        <h2 id="event-highlight-title" className="mt-4 pr-8 text-heading-3 text-ink-900">
          {event.title}
        </h2>

        <dl className="mt-3 space-y-1.5 text-body-sm text-ink-600">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Date</dt>
            <CalendarDays className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <dd>{event.date}</dd>
          </div>

          <div className="flex items-center gap-2">
            <dt className="sr-only">Location</dt>
            <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <dd>{event.location}</dd>
          </div>
        </dl>

        <p className="mt-4 text-body-sm leading-relaxed text-ink-600">{event.description}</p>

        <button
          type="button"
          onClick={close}
          className="mt-6 w-full rounded-lg bg-brand-700 px-4 py-2.5 text-body-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

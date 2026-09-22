"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";

export interface HeroSlide {
  id: string;
  /** An image URL, or a CSS gradient string while real photography is pending. */
  imageUrl: string;
  heading: string;
  subtext?: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface HeroBannerProps {
  slides: HeroSlide[];
  /** Milliseconds between automatic advances. Defaults to 6000. */
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 6000;

/** Gradients are placeholders, so they are applied as CSS rather than fetched. */
function isGradient(imageUrl: string): boolean {
  return imageUrl.startsWith("linear-gradient") || imageUrl.startsWith("radial-gradient");
}

/**
 * Hero carousel.
 *
 * Rotation follows the WAI-ARIA carousel pattern: `aria-live` is `"off"` while
 * the banner advances by itself (so a screen reader is not interrupted every few
 * seconds) and switches to `"polite"` as soon as the visitor takes control.
 */
export function HeroBanner({
  slides,
  intervalMs = DEFAULT_INTERVAL_MS,
}: HeroBannerProps): ReactElement | null {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const regionRef = useRef<HTMLElement>(null);

  const slideCount = slides.length;
  const isRotating = slideCount > 1 && !isPaused && !prefersReducedMotion;

  const goTo = useCallback(
    (index: number): void => {
      if (slideCount === 0) {
        return;
      }

      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback((): void => {
    setIsPaused(true);
    setActiveIndex((current) => (slideCount === 0 ? current : (current + 1) % slideCount));
  }, [slideCount]);

  const goPrevious = useCallback((): void => {
    setIsPaused(true);
    setActiveIndex(
      (current) => (slideCount === 0 ? current : (current - 1 + slideCount) % slideCount),
    );
  }, [slideCount]);

  // Honour the operating-system preference: auto-rotation is motion, and the
  // visitor who asked for less of it should not be shown a moving banner.
  useEffect((): (() => void) | undefined => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setPrefersReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);

    return (): void => {
      query.removeEventListener("change", update);
    };
  }, []);

  useEffect((): (() => void) | undefined => {
    if (!isRotating) {
      return undefined;
    }

    const timer = window.setInterval((): void => {
      setActiveIndex((current) => (slideCount === 0 ? current : (current + 1) % slideCount));
    }, intervalMs);

    return (): void => {
      window.clearInterval(timer);
    };
  }, [intervalMs, isRotating, slideCount]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
      return;
    }

    // Handing focus back to the document is the closest meaningful answer to
    // "Escape" for a region that cannot be closed: it dismisses the interaction.
    if (event.key === "Escape") {
      regionRef.current?.blur();
    }
  };

  if (slideCount === 0) {
    return null;
  }

  const activeSlide = slides[activeIndex];

  if (activeSlide === undefined) {
    return null;
  }

  return (
    <section
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured announcements"
      aria-live={isRotating ? "off" : "polite"}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onMouseEnter={(): void => setIsPaused(true)}
      onMouseLeave={(): void => setIsPaused(false)}
      onTouchStart={(): void => setIsPaused(true)}
      onFocus={(): void => setIsPaused(true)}
      onBlur={(): void => setIsPaused(false)}
      className="group relative isolate w-full overflow-hidden bg-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <div className="relative h-[70vh] min-h-[420px] w-full sm:min-h-[480px] md:h-[80vh]">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <article
              key={slide.id}
              aria-hidden={!isActive}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slideCount}: ${slide.heading}`}
              className={`absolute inset-0 flex items-center transition-all duration-700 ease-out ${
                isActive ? "scale-100 opacity-100" : "pointer-events-none scale-105 opacity-0"
              }`}
            >
              {isGradient(slide.imageUrl) ? (
                <div
                  aria-hidden="true"
                  style={{ backgroundImage: slide.imageUrl }}
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                // Placeholder photography is decorative: the heading below carries
                // the meaning, so the image is labelled as background art.
                <img
                  src={slide.imageUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {/* Readability scrim over both the photo and the gradient. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-ink-900/80 via-ink-900/40 to-ink-900/85"
              />

              <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="max-w-2xl">
                  <h1 className="text-heading-1 font-bold tracking-tight text-white md:text-display-1">
                    {slide.heading}
                  </h1>

                  {slide.subtext !== undefined ? (
                    <p className="mt-4 max-w-xl text-body text-ink-100 sm:text-body-lg">
                      {slide.subtext}
                    </p>
                  ) : null}

                  {isActive && slide.ctaText !== undefined && slide.ctaHref !== undefined ? (
                    <a
                      href={slide.ctaHref}
                      className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand-700 px-8 py-3 text-heading-4 text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-700"
                    >
                      {slide.ctaText}
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {/* Arrows: always reachable by keyboard, revealed on hover for pointer
            users on desktop and permanently visible on touch-sized screens. */}
        <button
          type="button"
          onClick={goPrevious}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-ink-900/50 p-2.5 text-white opacity-100 transition hover:bg-ink-900/70 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white md:opacity-0 md:group-hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-ink-900/50 p-2.5 text-white opacity-100 transition hover:bg-ink-900/70 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white md:opacity-0 md:group-hover:opacity-100"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={slide.id}
                type="button"
                onClick={(): void => {
                  setIsPaused(true);
                  goTo(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={isActive}
                className={`h-3 w-3 rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isActive
                    ? "border-brand-700 bg-brand-700"
                    : "border-ink-300 bg-transparent hover:border-brand-600"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

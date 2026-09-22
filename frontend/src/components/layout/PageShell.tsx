import type { ReactElement, ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export interface PageShellProps {
  children: ReactNode;
  /** Rendered as the page `h1` above the content. Omit when a section owns the h1 (e.g. the hero). */
  title?: string;
  /** Supporting line rendered under `title`. */
  description?: string;
  /**
   * Applies the standard content container to `<main>` (`max-w-7xl`, horizontal
   * padding, `py-8`). Pass `false` for pages that manage their own full-bleed
   * layout — the homepage hero, for instance, must reach the viewport edges.
   */
  contained?: boolean;
}

/**
 * Standard page chrome: sticky `Header`, content region, site `Footer`.
 *
 * `Header` is a client component but is imported directly — passing a client
 * component into a server component's tree is the normal App Router pattern,
 * so no dynamic import is required here.
 *
 * The wrapper is `min-h-screen flex-col` with a `flex-1` main, which pins the
 * footer to the bottom on pages whose content is shorter than the viewport.
 */
export function PageShell(props: PageShellProps): ReactElement {
  const { children, title, description, contained = true } = props;
  const hasIntro = title !== undefined || description !== undefined;

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <Header />

      <main id="main-content" className="flex-1">
        <div
          className={
            contained ? "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" : undefined
          }
        >
          {hasIntro ? (
            <div className="mb-8">
              {title !== undefined ? (
                <h1 className="text-heading-1 text-ink-900">{title}</h1>
              ) : null}

              {description !== undefined ? (
                <p className="mt-2 max-w-2xl text-body text-ink-600">{description}</p>
              ) : null}
            </div>
          ) : null}

          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

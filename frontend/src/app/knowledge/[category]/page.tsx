import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import KnowledgeCategoryContent from "@/components/knowledge/KnowledgeCategoryContent";
import { KNOWLEDGE_CATEGORIES } from "@/lib/knowledgeData";

/**
 * `/knowledge/[category]` — one of the ten knowledge-hub collections
 * (PRD §5.2.2–§5.2.11), served statically from the shared mock data.
 *
 * The shell mirrors `app/news/[slug]/page.tsx`: it resolves the slug against
 * the server-safe data module, composes the dark header band, and hands the
 * list rendering to the client `KnowledgeCategoryContent` switch. Unknown
 * slugs render a graceful not-found block inside the standard chrome.
 */

interface KnowledgeCategoryRouteProps {
  params: Promise<{ category: string }>;
}

/** "recommended" is a standalone route (§5.2.11), not a KnowledgeCategory. */
const RECOMMENDED_SLUG = "recommended";

const CATEGORY_ROUTES: Array<{ slug: string; name: string }> = [
  ...KNOWLEDGE_CATEGORIES.map((category) => ({ slug: category.slug, name: category.name })),
  { slug: RECOMMENDED_SLUG, name: "Recommended" },
];

export function generateStaticParams(): Array<{ category: string }> {
  return CATEGORY_ROUTES.map((route) => ({ category: route.slug }));
}

export async function generateMetadata({
  params,
}: KnowledgeCategoryRouteProps): Promise<Metadata> {
  const { category } = await params;
  const route = CATEGORY_ROUTES.find((entry) => entry.slug === category);

  if (route === undefined) {
    return {
      title: "Not found | Knowledge",
      description: "This knowledge collection could not be found.",
    };
  }

  const categoryEntry = KNOWLEDGE_CATEGORIES.find((entry) => entry.slug === category);
  const description =
    categoryEntry?.blurb ?? "Curated picks from across the FityatulHaq knowledge hub.";

  return {
    title: `${route.name} | Knowledge`,
    description,
  };
}

/** Focus treatment inlined because `Header.tsx` is a client module — its string
 * exports cannot be imported into this server component. Keep in sync with
 * `FOCUS_RING_DARK` there. */
const BAND_FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950";

const CATEGORY_INTROS: Record<string, string> = {
  courses: "Structured programmes with guided lessons — enrolment details in each course card.",
  camps: "Archives and resources from our annual summer and winter camps.",
  academic: "Research and papers shared by members and partner institutions.",
  encyclopedia: "A growing reference section across science, history and literature.",
  biography: "Life stories of scholars, leaders and community builders.",
  "youth-advice": "Practical guidance written for young members, by young members.",
  qa: "Community answers to the questions members ask most.",
  books: "The lending catalogue, from classical texts to modern titles.",
  videos: "Recorded lectures, camp highlights and step-by-step tutorials.",
  recommended: "The committee's curated picks from across the hub and the wider site.",
};

function categoryIntro(slug: string): string {
  return CATEGORY_INTROS[slug] ?? "Browse this knowledge collection.";
}

function CategoryNotFound(): ReactElement {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-brand-950">
      <section
        aria-label="Collection not found"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8"
      >
        <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Collection not found
        </h1>
        <p className="mt-3 max-w-md text-body text-ink-300">
          This knowledge collection does not exist or may have been moved.
        </p>
        <Link
          href="/knowledge"
          className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${BAND_FOCUS_RING}`}
        >
          ← Back to the Knowledge Hub
        </Link>
      </section>
    </div>
  );
}

export default async function KnowledgeCategoryRoute({
  params,
}: KnowledgeCategoryRouteProps): Promise<ReactElement> {
  const { category } = await params;
  const route = CATEGORY_ROUTES.find((entry) => entry.slug === category);

  if (route === undefined) {
    return (
      <AuthAwareShell contained={false}>
        <CategoryNotFound />
      </AuthAwareShell>
    );
  }

  const categoryEntry = KNOWLEDGE_CATEGORIES.find((entry) => entry.slug === category);

  return (
    <AuthAwareShell contained={false}>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0c1017]">
        {/* ── Header band ──────────────────────────────────────────── */}
        <header className="relative isolate overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
          />

          <div className="relative mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb" className="text-caption text-ink-400">
              <Link
                href="/"
                className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${BAND_FOCUS_RING}`}
              >
                Home
              </Link>
              <span aria-hidden="true" className="mx-2">
                /
              </span>
              <Link
                href="/knowledge"
                className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${BAND_FOCUS_RING}`}
              >
                Knowledge
              </Link>
              <span aria-hidden="true" className="mx-2">
                /
              </span>
              <span aria-current="page" className="text-ink-200">
                {route.name}
              </span>
            </nav>

            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
              {route.name}
            </h1>
            <p className="mt-3 max-w-xl text-body text-ink-300">{categoryIntro(category)}</p>

            {categoryEntry?.membersOnly ? (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50/10 px-3 py-1 text-caption font-semibold text-accent-300">
                Browsing is open to everyone — downloads need a member account.
              </p>
            ) : null}
          </div>
        </header>

        {/* ── Collection content ───────────────────────────────────── */}
        <main className="flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <KnowledgeCategoryContent slug={category} />
          </div>
        </main>
      </div>
    </AuthAwareShell>
  );
}

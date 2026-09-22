"use client";

import { useCallback, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { AnnouncementsSection } from "@/components/home/AnnouncementsSection";
import { EventHighlightModal } from "@/components/home/EventHighlightModal";
import { HeroBanner, type HeroSlide } from "@/components/home/HeroBanner";
import { KnowledgeHighlights } from "@/components/home/KnowledgeHighlights";
import { NewsSection, type NewsCardData } from "@/components/home/NewsSection";
import { PillarCards, type PillarCardData } from "@/components/home/PillarCards";
import { RegisterCTA } from "@/components/home/RegisterCTA";
import { WebboardThreads, type ThreadPreview } from "@/components/home/WebboardThreads";
import { useAuth } from "@/context/AuthContext";
import { token } from "@/styles/designTokens";
import type { AnnouncementItem } from "@/components/home/AnnouncementsSection";
import type { KnowledgeCardData } from "@/components/home/KnowledgeHighlights";
import type { HighlightedEvent } from "@/components/home/EventHighlightModal";

/**
 * Homepage content.
 *
 * PHASE 4: every section is fed from the mock data below, which mirrors the
 * shape of `GET /news`, `/announcements`, `/knowledge` and `/webboard` exactly,
 * so swapping to the real API later is a data change rather than a layout one.
 * Dates are fixed ISO strings — they keep the prerendered HTML deterministic.
 * Hero placeholder gradients are composed from design tokens rather than raw
 * hex values, so a rebrand re-skins them automatically.
 */

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "hero-welcome",
    imageUrl: `linear-gradient(135deg, ${token.color.brand[500]} 0%, ${token.color.brand[700]} 55%, ${token.color.brand[900]} 100%)`,
    heading: "Welcome to FityatulHaq",
    subtext:
      "A community built around young people: learning together, serving together, and growing together.",
    ctaText: "Join the community",
    ctaHref: "/register",
  },
  {
    id: "hero-youth",
    imageUrl: `linear-gradient(135deg, ${token.color.state.info[500]} 0%, ${token.color.state.info[600]} 60%, ${token.color.state.info[900]} 100%)`,
    heading: "Youth Development Programs",
    subtext: "Mentoring, camps and courses designed to build skills that last a lifetime.",
    ctaText: "See the programmes",
    ctaHref: "/knowledge",
  },
  {
    id: "hero-community",
    imageUrl: `linear-gradient(135deg, ${token.color.state.warning[500]} 0%, ${token.color.state.warning[700]} 55%, ${token.color.state.warning[900]} 100%)`,
    heading: "Community Service Initiative",
    subtext: "This season's volunteering drive is open — find a project near you and take part.",
    ctaText: "Read the announcements",
    ctaHref: "/announcements",
  },
];

const HIGHLIGHTED_EVENT: HighlightedEvent = {
  id: "annual-gathering-2026",
  title: "FityatulHaq Annual Youth Gathering",
  date: "Saturday, 17 October 2026 · 09:00 – 16:00",
  location: "Springfield Community Hall, 12 Community Way",
  description:
    "A full day of workshops, mentoring circles and service projects, closing with the annual " +
    "members' assembly. Open to all members and their families; lunch is provided.",
};

const PILLARS: PillarCardData[] = [
  {
    id: "pillar-communication",
    title: "Communication",
    description: "News, notices and everything happening across the organisation.",
    iconType: "megaphone",
    href: "/news",
  },
  {
    id: "pillar-information",
    title: "Information",
    description: "Courses, encyclopedias and reference material, free for members.",
    iconType: "book-open",
    href: "/knowledge",
  },
  {
    id: "pillar-community",
    title: "Community",
    description: "Ask questions and share experience on the member webboard.",
    iconType: "users",
    href: "/webboard",
  },
  {
    id: "pillar-administration",
    title: "Administration",
    description: "Official announcements, decisions and published documents.",
    iconType: "clipboard-list",
    href: "/announcements",
  },
];

const NEWS_ITEMS: NewsCardData[] = [
  {
    id: "news-1",
    title: "Autumn mentoring programme opens for applications",
    excerpt:
      "Fifty places are available across four branches this autumn. Applications close at the end of the month, and successful applicants are matched with a mentor within two weeks.",
    department: "Youth Programs",
    publishedAt: "2026-09-19T09:15:00Z",
    authorName: "Amina Rahman",
  },
  {
    id: "news-2",
    title: "Volunteers repaint the community reading room",
    excerpt:
      "More than forty members turned out over the weekend to repaint and restock the reading room used by the after-school club.",
    department: "Community Events",
    publishedAt: "2026-09-14T14:00:00Z",
    authorName: "Daniel Osei",
  },
  {
    id: "news-3",
    title: "New encyclopaedia volumes added to the digital library",
    excerpt:
      "Twelve new volumes covering science, history and literature are now available to all members in the knowledge hub.",
    department: "Education",
    publishedAt: "2026-09-08T08:30:00Z",
    authorName: "Sofia Marchetti",
  },
  {
    id: "news-4",
    title: "Annual general meeting: agenda and papers published",
    excerpt:
      "The agenda, last year's minutes and the audited accounts are now available ahead of October's assembly.",
    department: "Organisation",
    publishedAt: "2026-09-02T16:45:00Z",
    authorName: "Committee Secretary",
  },
  {
    id: "news-5",
    title: "Summer camp highlights: 120 young people, four branches",
    excerpt:
      "A look back at this year's camps, which ran across four sites and finished with a shared community evening.",
    department: "Youth Programs",
    publishedAt: "2026-08-21T11:00:00Z",
    authorName: "Amina Rahman",
  },
  {
    id: "news-6",
    title: "Partnership agreed with the regional youth council",
    excerpt:
      "The two-year agreement opens joint funding for leadership training and gives our members access to regional facilities.",
    department: "Organisation",
    publishedAt: "2026-08-12T10:20:00Z",
    authorName: "Daniel Osei",
  },
  {
    id: "news-7",
    title: "Weekend maths clinic returns for the new term",
    excerpt:
      "The volunteer-run clinic resumes on the first Saturday of term, with sessions for ages 11 to 16.",
    department: "Education",
    publishedAt: "2026-08-04T09:00:00Z",
    authorName: "Sofia Marchetti",
  },
  {
    id: "news-8",
    title: "Charity football match raises funds for the book fund",
    excerpt:
      "The match between the senior and junior squads raised enough to buy two hundred new titles.",
    department: "Community Events",
    publishedAt: "2026-07-28T18:30:00Z",
    authorName: "Daniel Osei",
  },
];

const ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "ann-1",
    refNumber: "FH/ANN/2026/091",
    title: "Notice of the annual general meeting and election of committee",
    publishedAt: "2026-09-18T12:00:00Z",
  },
  {
    id: "ann-2",
    refNumber: "FH/ANN/2026/090",
    title: "Opening of applications: youth mentoring programme, autumn intake",
    publishedAt: "2026-09-15T09:00:00Z",
  },
  {
    id: "ann-3",
    refNumber: "FH/ANN/2026/088",
    title: "Revision of the member code of conduct, effective 1 October",
    publishedAt: "2026-09-05T15:30:00Z",
  },
  {
    id: "ann-4",
    refNumber: "FH/ANN/2026/085",
    title: "Call for volunteer session leaders, weekend study clubs",
    publishedAt: "2026-08-24T10:00:00Z",
  },
  {
    id: "ann-5",
    refNumber: "FH/ANN/2026/081",
    title: "Approved minutes of the July committee meeting",
    publishedAt: "2026-08-11T13:45:00Z",
  },
  {
    id: "ann-6",
    refNumber: "FH/ANN/2026/079",
    title: "Publication of the 2025 audited financial statements",
    publishedAt: "2026-08-02T09:20:00Z",
  },
];

const KNOWLEDGE_ITEMS: KnowledgeCardData[] = [
  {
    id: "know-1",
    title: "Foundations of Youth Leadership",
    category: "courses",
    duration: "8 lessons · 4h",
    level: "Beginner",
  },
  {
    id: "know-2",
    title: "Summer Camp 2026: Photo Essays",
    category: "camps",
    level: "All levels",
  },
  {
    id: "know-3",
    title: "The Reading Room Collection",
    category: "books",
    level: "Reference",
  },
  {
    id: "know-4",
    title: "Encyclopaedia of World Cultures",
    category: "encyclopedia",
    duration: "12 volumes",
  },
  {
    id: "know-5",
    title: "Public Speaking Workshop Recordings",
    category: "videos",
    duration: "6 sessions",
  },
  {
    id: "know-6",
    title: "Project Planning for Community Groups",
    category: "courses",
    duration: "5 lessons · 3h",
    level: "Intermediate",
  },
];

const THREADS: ThreadPreview[] = [
  {
    id: "thread-1",
    board: "General",
    title: "How do I apply for the autumn mentoring programme?",
    lastReplyAt: "2026-09-21T05:10:00Z",
    replyCount: 7,
    isNew: true,
  },
  {
    id: "thread-2",
    board: "Youth Care",
    title: "Ideas for keeping 12–14s engaged during study club",
    lastReplyAt: "2026-09-20T19:40:00Z",
    replyCount: 12,
  },
  {
    id: "thread-3",
    board: "General",
    title: "Car-sharing to the annual gathering from the north branch",
    lastReplyAt: "2026-09-20T08:05:00Z",
    replyCount: 4,
    isNew: true,
  },
  {
    id: "thread-4",
    board: "Youth Care",
    title: "Recommended reading for first-time mentors",
    lastReplyAt: "2026-09-18T21:15:00Z",
    replyCount: 9,
  },
  {
    id: "thread-5",
    board: "General",
    title: "Where are the minutes from the July committee meeting?",
    lastReplyAt: "2026-09-16T14:25:00Z",
    replyCount: 3,
  },
  {
    id: "thread-6",
    board: "Youth Care",
    title: "Balancing camp duties with exam revision",
    lastReplyAt: "2026-09-11T17:50:00Z",
    replyCount: 15,
  },
  {
    id: "thread-7",
    board: "General",
    title: "Volunteer hours: how are they recorded?",
    lastReplyAt: "2026-09-04T09:35:00Z",
    replyCount: 6,
  },
  {
    id: "thread-8",
    board: "Youth Care",
    title: "Starting a new branch: what does the committee need?",
    lastReplyAt: "2026-08-27T12:00:00Z",
    replyCount: 8,
  },
];

/**
 * Client composition of the homepage.
 *
 * Lives outside `app/page.tsx` because the page exports `metadata`, which is
 * only allowed on a server component, while the CTA needs the session from
 * `AuthProvider` and the sections need navigation callbacks.
 *
 * Page chrome — the sticky header, the content region and the footer — is
 * supplied by `PageShell` through `AuthAwareShell`; this component renders
 * only what sits between them.
 */
export function HomePage(): ReactElement {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const goTo = useCallback(
    (path: string): void => {
      router.push(path);
    },
    [router],
  );

  const handleViewBoard = useCallback(
    (board: string): void => {
      router.push(`/webboard/${board.trim().toLowerCase().replace(/\s+/g, "-")}`);
    },
    [router],
  );

  return (
    <>
      <HeroBanner slides={HERO_SLIDES} />

      <section
        aria-label="What FityatulHaq does"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <PillarCards pillars={PILLARS} />
      </section>

      <section
        aria-label="Latest news"
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
      >
        <NewsSection newsItems={NEWS_ITEMS} onViewAll={(): void => goTo("/news")} />
      </section>

      <section
        aria-label="Official announcements"
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
      >
        <AnnouncementsSection
          announcements={ANNOUNCEMENTS}
          onViewAll={(): void => goTo("/announcements")}
        />
      </section>

      <section
        aria-label="Explore and learn"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <KnowledgeHighlights
          items={KNOWLEDGE_ITEMS}
          onViewAll={(): void => goTo("/knowledge")}
        />
      </section>

      {isLoading ? (
        <div aria-hidden="true" className="py-16" />
      ) : (
        <RegisterCTA isLoggedIn={isAuthenticated} />
      )}

      <section
        aria-label="Community discussions"
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
      >
        <WebboardThreads
          threads={THREADS}
          onViewBoard={handleViewBoard}
          canPost={isAuthenticated}
        />
      </section>

      <EventHighlightModal event={HIGHLIGHTED_EVENT} />
    </>
  );
}

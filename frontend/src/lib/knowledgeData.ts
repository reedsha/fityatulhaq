/* MOCK — DELETE after Live API swap */

/**
 * Mock knowledge-hub data — plain, server-safe module (no `"use client"`
 * directive), shaped identically to what the API will return.
 *
 * Exactly nine categories for the Phase 6 hub preview. `icon` holds a lucide
 * icon NAME as a string; the client component maps it through a typed Record.
 * `membersOnly: true` marks the three collections that unlock for signed-in
 * members — the UI shows the badge only; it simulates no lock behaviour.
 */

export interface KnowledgeCategory {
  id: string;
  /** URL path segment under /knowledge — mirrors PRD §5.2 routes. */
  slug: string;
  name: string;
  blurb: string;
  icon: string;
  membersOnly: boolean;
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: "kc-courses",
    slug: "courses",
    name: "Courses",
    blurb: "Structured programmes with guided lessons and progress tracking.",
    icon: "GraduationCap",
    membersOnly: false,
  },
  {
    id: "kc-camps",
    slug: "camps",
    name: "Camps",
    blurb: "Archives and resources from our annual summer and winter camps.",
    icon: "Tent",
    membersOnly: false,
  },
  {
    id: "kc-papers",
    slug: "academic",
    name: "Academic Papers",
    blurb: "Research and papers shared by members and partner institutions.",
    icon: "FileText",
    membersOnly: true,
  },
  {
    id: "kc-encyclopedia",
    slug: "encyclopedia",
    name: "Encyclopedia",
    blurb: "A growing reference section across science, history and literature.",
    icon: "Library",
    membersOnly: false,
  },
  {
    id: "kc-biography",
    slug: "biography",
    name: "Biography",
    blurb: "Life stories of scholars, leaders and community builders.",
    icon: "BookOpen",
    membersOnly: false,
  },
  {
    id: "kc-youth-advice",
    slug: "youth-advice",
    name: "Youth Advice",
    blurb: "Practical guidance written for young members, by young members.",
    icon: "Lightbulb",
    membersOnly: false,
  },
  {
    id: "kc-qa-corner",
    slug: "qa",
    name: "Q&A Corner",
    blurb: "Community answers to the questions members ask most.",
    icon: "MessagesSquare",
    membersOnly: false,
  },
  {
    id: "kc-books",
    slug: "books",
    name: "Books Library",
    blurb: "The lending catalogue, from classical texts to modern titles.",
    icon: "Book",
    membersOnly: true,
  },
  {
    id: "kc-videos",
    slug: "videos",
    name: "Video Library",
    blurb: "Recorded lectures, camp highlights and step-by-step tutorials.",
    icon: "Video",
    membersOnly: true,
  },
];

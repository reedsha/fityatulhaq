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
  name: string;
  blurb: string;
  icon: string;
  membersOnly: boolean;
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: "kc-courses",
    name: "Courses",
    blurb: "Structured programmes with guided lessons and progress tracking.",
    icon: "GraduationCap",
    membersOnly: false,
  },
  {
    id: "kc-camps",
    name: "Camps",
    blurb: "Archives and resources from our annual summer and winter camps.",
    icon: "Tent",
    membersOnly: false,
  },
  {
    id: "kc-papers",
    name: "Academic Papers",
    blurb: "Research and papers shared by members and partner institutions.",
    icon: "FileText",
    membersOnly: true,
  },
  {
    id: "kc-encyclopedia",
    name: "Encyclopedia",
    blurb: "A growing reference section across science, history and literature.",
    icon: "Library",
    membersOnly: false,
  },
  {
    id: "kc-biography",
    name: "Biography",
    blurb: "Life stories of scholars, leaders and community builders.",
    icon: "BookOpen",
    membersOnly: false,
  },
  {
    id: "kc-youth-advice",
    name: "Youth Advice",
    blurb: "Practical guidance written for young members, by young members.",
    icon: "Lightbulb",
    membersOnly: false,
  },
  {
    id: "kc-qa-corner",
    name: "Q&A Corner",
    blurb: "Community answers to the questions members ask most.",
    icon: "MessagesSquare",
    membersOnly: false,
  },
  {
    id: "kc-books",
    name: "Books Library",
    blurb: "The lending catalogue, from classical texts to modern titles.",
    icon: "Book",
    membersOnly: true,
  },
  {
    id: "kc-videos",
    name: "Video Library",
    blurb: "Recorded lectures, camp highlights and step-by-step tutorials.",
    icon: "Video",
    membersOnly: true,
  },
];

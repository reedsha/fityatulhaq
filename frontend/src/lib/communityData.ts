/* MOCK — DELETE after Live API swap */

/**
 * Mock community programme data — plain, server-safe module (no
 * `"use client"` directive), shaped identically to what the API will return.
 *
 * Exactly four programmes, mirroring the dashboard's three category cards
 * plus the volunteering arm. `icon` holds a lucide icon NAME as a string;
 * the client component maps it to the imported component through a typed
 * Record — no dynamic imports, no images.
 */

export interface Programme {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
}

export const PROGRAMMES: Programme[] = [
  {
    id: "prog-1",
    name: "Fit Family",
    tagline: "The family learning circle",
    description:
      "Parents and children learn side by side — weekend study, shared projects and service days that put families to work together.",
    icon: "HeartHandshake",
  },
  {
    id: "prog-2",
    name: "TMYDA Youth Association",
    tagline: "By young people, for young people",
    description:
      "The member-led youth association: camps, sports, leadership training and the regional youth council partnership.",
    icon: "Users",
  },
  {
    id: "prog-3",
    name: "Women's Office (SDU TMYDA)",
    tagline: "Supporting women's leadership",
    description:
      "Programmes that develop the skills, confidence and networks of young women across every branch.",
    icon: "Sparkles",
  },
  {
    id: "prog-4",
    name: "Volunteers Network",
    tagline: "Give your time and skills",
    description:
      "The volunteering arm — coordinators, mentors and helpers who make every programme run, matched to the role that fits you.",
    icon: "HandHelping",
  },
];

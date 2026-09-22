/**
 * Mock partner data — plain, server-safe module (no `"use client"` directive),
 * shaped identically to what the API will return.
 *
 * All organisations are invented placeholders with `example.org` hrefs; no
 * real companies or charities are named.
 */

export interface Partner {
  id: string;
  name: string;
  description: string;
  href: string;
  category: string;
}

export const PARTNERS: Partner[] = [
  {
    id: "p-1",
    name: "Springfield Learning Trust",
    description: "Runs the shared tutoring programme for member branches.",
    href: "https://example.org/partners/springfield-learning-trust",
    category: "Education",
  },
  {
    id: "p-2",
    name: "The Open Study Circle",
    description: "Weekend revision sessions hosted across the city.",
    href: "https://example.org/partners/open-study-circle",
    category: "Education",
  },
  {
    id: "p-3",
    name: "Riverside Tutorial College",
    description: "Provides exam-preparation places for senior members.",
    href: "https://example.org/partners/riverside-tutorial-college",
    category: "Education",
  },
  {
    id: "p-4",
    name: "Meridian Book Fund",
    description: "Supplies the annual intake of library titles.",
    href: "https://example.org/partners/meridian-book-fund",
    category: "Education",
  },
  {
    id: "p-5",
    name: "Springfield Community Centre",
    description: "Home ground for our weekend clubs and meetings.",
    href: "https://example.org/partners/springfield-community-centre",
    category: "Community",
  },
  {
    id: "p-6",
    name: "Neighbourhood Care Network",
    description: "Coordinates our joint volunteering calendar.",
    href: "https://example.org/partners/neighbourhood-care-network",
    category: "Community",
  },
  {
    id: "p-7",
    name: "City Volunteer Hub",
    description: "Matches members with local service projects.",
    href: "https://example.org/partners/city-volunteer-hub",
    category: "Community",
  },
  {
    id: "p-8",
    name: "NextGen Mentoring Network",
    description: "Trains and places the mentors for our autumn intake.",
    href: "https://example.org/partners/nextgen-mentoring-network",
    category: "Youth Development",
  },
  {
    id: "p-9",
    name: "Harmony Youth Alliance",
    description: "Partner on the inter-branch sports and camps programme.",
    href: "https://example.org/partners/harmony-youth-alliance",
    category: "Youth Development",
  },
  {
    id: "p-10",
    name: "The Future Builders Collective",
    description: "Runs leadership weekends for senior youth members.",
    href: "https://example.org/partners/future-builders-collective",
    category: "Youth Development",
  },
];

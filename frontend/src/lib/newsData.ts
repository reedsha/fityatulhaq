/**
 * Mock news data — the single source shared by the `/news` listing (client
 * component) and the `/news/[slug]` route shell (server component, which reads
 * it in `generateMetadata`).
 *
 * Deliberately a plain module with no `"use client"` directive: server
 * components cannot read values out of a client module's exports, so anything
 * both sides need must live here.
 *
 * The array is shaped identically to what the API will return — swapping to a
 * fetch call later requires zero component changes.
 */

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  coverUrl?: string;
  department: string;
  publishedAt: string;
  authorName: string;
}

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "n-1",
    title: "Autumn mentoring programme opens for applications",
    excerpt:
      "Fifty places are available across four branches this autumn. Applications close at the end of the month, and successful applicants are matched with a mentor within two weeks.",
    coverUrl: undefined,
    department: "Youth Programs",
    publishedAt: "2026-09-19T09:15:00Z",
    authorName: "Amina Rahman",
  },
  {
    id: "n-2",
    title: "Volunteers repaint the community reading room",
    excerpt:
      "More than forty members turned out over the weekend to repaint and restock the reading room used by the after-school club.",
    coverUrl: undefined,
    department: "Community Events",
    publishedAt: "2026-09-14T14:00:00Z",
    authorName: "Daniel Osei",
  },
  {
    id: "n-3",
    title: "New encyclopaedia volumes added to the digital library",
    excerpt:
      "Twelve new volumes covering science, history and literature are now available to all members in the knowledge hub.",
    coverUrl: undefined,
    department: "Education",
    publishedAt: "2026-09-08T08:30:00Z",
    authorName: "Sofia Marchetti",
  },
  {
    id: "n-4",
    title: "Annual general meeting: agenda and papers published",
    excerpt:
      "The agenda, last year's minutes and the audited accounts are now available ahead of October's assembly.",
    coverUrl: undefined,
    department: "Organisation",
    publishedAt: "2026-09-02T16:45:00Z",
    authorName: "Committee Secretary",
  },
  {
    id: "n-5",
    title: "Summer camp highlights: 120 young people, four branches",
    excerpt:
      "A look back at this year's camps, which ran across four sites and finished with a shared community evening.",
    coverUrl: undefined,
    department: "Youth Programs",
    publishedAt: "2026-08-21T11:00:00Z",
    authorName: "Amina Rahman",
  },
  {
    id: "n-6",
    title: "Partnership agreed with the regional youth council",
    excerpt:
      "The two-year agreement opens joint funding for leadership training and gives our members access to regional facilities.",
    coverUrl: undefined,
    department: "Organisation",
    publishedAt: "2026-08-12T10:20:00Z",
    authorName: "Daniel Osei",
  },
  {
    id: "n-7",
    title: "Weekend maths clinic returns for the new term",
    excerpt:
      "The volunteer-run clinic resumes on the first Saturday of term, with sessions for ages 11 to 16.",
    coverUrl: undefined,
    department: "Education",
    publishedAt: "2026-08-04T09:00:00Z",
    authorName: "Sofia Marchetti",
  },
  {
    id: "n-8",
    title: "Charity football match raises funds for the book fund",
    excerpt:
      "The match between the senior and junior squads raised enough to buy two hundred new titles.",
    coverUrl: undefined,
    department: "Community Events",
    publishedAt: "2026-07-28T18:30:00Z",
    authorName: "Daniel Osei",
  },
];

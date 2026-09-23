/* MOCK — DELETE after Live API swap */

/**
 * Mock announcement data — the single source shared by the `/announcements`
 * listing (client component) and the `/announcements/[slug]` route shell
 * (server component, which reads it in `generateMetadata`).
 *
 * Deliberately a plain module with no `"use client"` directive: server
 * components cannot read values out of a client module's exports, so anything
 * both sides need must live here.
 *
 * The array is shaped identically to what the API will return — swapping to a
 * fetch call later requires zero component changes. The mock `pdfUrl`s point
 * at `/documents/announcements/*.pdf`, which do not exist yet; that is
 * expected for this phase.
 */

export interface AnnouncementItem {
  id: string;
  refNumber: string;
  title: string;
  date: string;
  /** Present when a circular PDF is published for this notice. */
  pdfUrl?: string;
}

export const ALL_CATEGORY = "All Categories";

export const ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "a-1",
    refNumber: "FH/ANN/2026/091",
    title: "Notice of the annual general meeting and election of committee",
    date: "2026-09-18T12:00:00Z",
    pdfUrl: "/documents/announcements/fh-ann-2026-091.pdf",
  },
  {
    id: "a-2",
    refNumber: "FH/ANN/2026/090",
    title: "Opening of applications: youth mentoring programme, autumn intake",
    date: "2026-09-15T09:00:00Z",
  },
  {
    id: "a-3",
    refNumber: "FH/ANN/2026/088",
    title: "Revision of the member code of conduct, effective 1 October",
    date: "2026-09-05T15:30:00Z",
    pdfUrl: "/documents/announcements/fh-ann-2026-088.pdf",
  },
  {
    id: "a-4",
    refNumber: "FH/ANN/2026/085",
    title: "Call for volunteer session leaders, weekend study clubs",
    date: "2026-08-24T10:00:00Z",
  },
  {
    id: "a-5",
    refNumber: "FH/ANN/2026/081",
    title: "Approved minutes of the July committee meeting",
    date: "2026-08-11T13:45:00Z",
    pdfUrl: "/documents/announcements/fh-ann-2026-081.pdf",
  },
  {
    id: "a-6",
    refNumber: "FH/ANN/2026/079",
    title: "Publication of the 2025 audited financial statements",
    date: "2026-08-02T09:20:00Z",
    pdfUrl: "/documents/announcements/fh-ann-2026-079.pdf",
  },
];

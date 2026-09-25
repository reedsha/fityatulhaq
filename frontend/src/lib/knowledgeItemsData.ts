/* MOCK — DELETE after Live API swap */

/**
 * Mock knowledge-collection items — a plain, server-safe module (no
 * `"use client"` directive), shaped like the future API payloads.
 *
 * All names, titles and institutions are fictional. `assetId` values are mock
 * strings handed to the real `POST /api/v1/assets/sign` endpoint, which answers
 * 503 until the Web 2 archive sync lands (M6) — the UI reports that honestly.
 *
 * The `embedUrl` values point at Blender Foundation's open test film on
 * youtube-nocookie — an explicitly-placeholder demo embed. Replace with real
 * organisation recordings at content-fill time.
 */

// ---------------------------------------------------------------
// §5.2.2 Courses — public
// ---------------------------------------------------------------

export interface CourseItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lessons: number;
}

export const COURSES: CourseItem[] = [
  {
    id: "course-c1",
    title: "Foundations of Tajwid",
    description:
      "A guided introduction to recitation rules, with weekly practice circles and recorded review sessions.",
    startDate: "2026-10-05",
    difficulty: "Beginner",
    lessons: 12,
  },
  {
    id: "course-c2",
    title: "Arabic for Readers",
    description:
      "Vocabulary and grammar for members who want to read classical texts with a dictionary, not a translator.",
    startDate: "2026-11-02",
    difficulty: "Intermediate",
    lessons: 16,
  },
  {
    id: "course-c3",
    title: "Public Speaking for Youth",
    description:
      "Structure, delivery and nerves — a practical workshop series ending in a community showcase evening.",
    startDate: "2026-10-19",
    difficulty: "Beginner",
    lessons: 8,
  },
  {
    id: "course-c4",
    title: "Study Methods Intensive",
    description:
      "Spaced repetition, note systems and exam planning for senior students, taught by senior students.",
    startDate: "2027-01-11",
    difficulty: "Advanced",
    lessons: 10,
  },
];

// ---------------------------------------------------------------
// §5.2.3 Camps — public
// ---------------------------------------------------------------

export interface CampItem {
  id: string;
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  location: string;
  season: "Summer" | "Winter";
}

export const CAMPS: CampItem[] = [
  {
    id: "camp-m1",
    title: "Summer Knowledge Camp",
    summary:
      "Seven days of study circles, sports and night programmes, closing with the traditional showcase afternoon.",
    startDate: "2025-07-14",
    endDate: "2025-07-20",
    location: "Hillcrest Retreat Centre",
    season: "Summer",
  },
  {
    id: "camp-m2",
    title: "Winter Youth Camp",
    summary:
      "A shorter indoor camp focused on mentorship pairings, workshops and the annual quiz tournament.",
    startDate: "2025-12-22",
    endDate: "2025-12-26",
    location: "Lakeside Lodge",
    season: "Winter",
  },
  {
    id: "camp-m3",
    title: "Summer Family Camp",
    summary:
      "The first camp to open places for parents alongside youth — shared meals, parallel study tracks.",
    startDate: "2026-07-13",
    endDate: "2026-07-19",
    location: "Hillcrest Retreat Centre",
    season: "Summer",
  },
  {
    id: "camp-m4",
    title: "Winter Reflection Camp",
    summary:
      "A quiet-format camp: guided journaling, small-group discussion and an end-of-year review circle.",
    startDate: "2026-12-21",
    endDate: "2026-12-24",
    location: "Pine Valley House",
    season: "Winter",
  },
];

// ---------------------------------------------------------------
// §5.2.4 Academic Papers — public list, member download
// ---------------------------------------------------------------

export interface PaperItem {
  id: string;
  title: string;
  abstract: string;
  authors: string;
  tags: string[];
  publishedAt: string;
  assetId: string;
  fileType: "PDF" | "Word";
}

export const PAPERS: PaperItem[] = [
  {
    id: "paper-p1",
    title: "Peer Mentorship in Small Youth Associations",
    abstract:
      "A qualitative study of pairing models across three community associations, with retention findings over two academic years.",
    authors: "Research circle, Fit Family programme",
    tags: ["Mentorship", "Community"],
    publishedAt: "2025-09-14",
    assetId: "paper-p1",
    fileType: "PDF",
  },
  {
    id: "paper-p2",
    title: "Balancing School and Supplementary Study",
    abstract:
      "Survey data from 60 members on weekly study load, with scheduling recommendations for term-time programmes.",
    authors: "Education office working group",
    tags: ["Study Methods", "Wellbeing"],
    publishedAt: "2026-01-20",
    assetId: "paper-p2",
    fileType: "PDF",
  },
  {
    id: "paper-p3",
    title: "Running a Community Library on Volunteer Hours",
    abstract:
      "Operations notes from two years of the lending catalogue: shelving systems, due-date discipline and loss rates.",
    authors: "Library team",
    tags: ["Library", "Volunteering"],
    publishedAt: "2026-03-02",
    assetId: "paper-p3",
    fileType: "Word",
  },
  {
    id: "paper-p4",
    title: "Camp Programmes and Long-Term Friendship Networks",
    abstract:
      "Follow-up interviews with camp alumni examining which programme formats produced lasting peer networks.",
    authors: "Research circle, Fit Family programme",
    tags: ["Camps", "Community"],
    publishedAt: "2026-05-18",
    assetId: "paper-p4",
    fileType: "PDF",
  },
];

// ---------------------------------------------------------------
// §5.2.5 Encyclopedia — public
// ---------------------------------------------------------------

export interface EncyclopediaItem {
  id: string;
  title: string;
  summary: string;
  tags: string[];
}

export const ENCYCLOPEDIA_ENTRIES: EncyclopediaItem[] = [
  {
    id: "ency-e1",
    title: "The Hijri Calendar",
    summary:
      "How the lunar year works, why it drifts against the solar calendar, and how camp dates are chosen each year.",
    tags: ["History", "Reference"],
  },
  {
    id: "ency-e2",
    title: "Manuscript Preservation Basics",
    summary:
      "Temperature, light and handling — a starter guide to why old books are kept the way they are kept.",
    tags: ["Library", "Reference"],
  },
  {
    id: "ency-e3",
    title: "A Short Geography of the Silk Road Cities",
    summary:
      "Six cities that shaped scholarship trade routes, with the maps our study circles use.",
    tags: ["Geography", "History"],
  },
  {
    id: "ency-e4",
    title: "Water in the Desert Garden",
    summary:
      "Traditional irrigation methods and what modern community gardens borrow from them.",
    tags: ["Science"],
  },
  {
    id: "ency-e5",
    title: "Calligraphy Instruments",
    summary:
      "The reed pen, the ink slab and the knife — an illustrated vocabulary of the calligrapher's desk.",
    tags: ["Arts", "Reference"],
  },
];

// ---------------------------------------------------------------
// §5.2.6 Biography — public
// ---------------------------------------------------------------

export interface BiographyItem {
  id: string;
  name: string;
  field: string;
  summary: string;
  initials: string;
}

export const BIOGRAPHIES: BiographyItem[] = [
  {
    id: "bio-b1",
    name: "Ustaz Ahmad Fikri",
    field: "Education",
    summary:
      "A village teacher who built a night school into a full-time academy, told through his students' notes.",
    initials: "AF",
  },
  {
    id: "bio-b2",
    name: "Dr. Maryam Suleiman",
    field: "Medicine",
    summary:
      "The community clinic she founded ran for thirty years and trained two generations of volunteer nurses.",
    initials: "MS",
  },
  {
    id: "bio-b3",
    name: "Hafiz Yusuf Karim",
    field: "Recitation",
    summary:
      "From a small-town study circle to international competition — and back home to teach the beginners' class.",
    initials: "YK",
  },
  {
    id: "bio-b4",
    name: "Zaynab Abdullahi",
    field: "Community Leadership",
    summary:
      "The organiser behind our association's sister-city partnerships and the annual book drive.",
    initials: "ZA",
  },
];

// ---------------------------------------------------------------
// §5.2.7 Youth Advice — public
// ---------------------------------------------------------------

export interface AdviceArticle {
  id: string;
  title: string;
  topic: string;
  paragraphs: string[];
}

export const YOUTH_ADVICE_ARTICLES: AdviceArticle[] = [
  {
    id: "advice-a1",
    title: "Starting the Term Without Burning Out",
    topic: "Study Methods",
    paragraphs: [
      "The first fortnight sets the rhythm for the whole term. Pick two fixed study blocks and guard them before anything else fills the calendar.",
      "Write the block down where you plan your week, not where you plan your goals — a plan you cannot see on a Tuesday evening is not a plan.",
      "Finally, choose one evening a week with nothing scheduled. Rest that is planned survives; rest that is leftover does not.",
    ],
  },
  {
    id: "advice-a2",
    title: "How to Ask a Question You Think Is Too Simple",
    topic: "Community",
    paragraphs: [
      "Every study circle has one question nobody asks because everybody assumes the others know the answer. Half the time, everyone is assuming the same thing.",
      "Write the question down before the session ends and hand it to the facilitator anonymously if you prefer. Most circles answer written questions first for exactly this reason.",
      "The fastest way to find out a question was not too simple: ask it, and count how many people write the answer down.",
    ],
  },
  {
    id: "advice-a3",
    title: "Volunteering When Your Week Is Already Full",
    topic: "Volunteering",
    paragraphs: [
      "Volunteering is not a second timetable. Pick the smallest recurring task the community genuinely needs — shelving books, setting chairs, greeting at the door.",
      "A small task done every week beats a large task done once. The committee can plan around what is reliable.",
      "Tell the coordinator your real capacity, including exam weeks. A volunteer who says 'not in December' is a volunteer who is still there in January.",
    ],
  },
  {
    id: "advice-a4",
    title: "Preparing for Your First Camp",
    topic: "Camps",
    paragraphs: [
      "Pack for the timetable, not for the weather report: one warm layer for night programmes, one set of clothes you do not mind painting in.",
      "Bring a notebook you actually like. You will fill it faster than you expect.",
      "Introduce yourself to one person before the first meal. Camp friendships almost always start in the queue, not in the sessions.",
    ],
  },
];

// ---------------------------------------------------------------
// §5.2.8 Q&A Corner — public answers, member ask (M4 logging)
// ---------------------------------------------------------------

export interface QaEntry {
  id: string;
  question: string;
  answer: string;
  answeredAt: string;
}

export const QA_ENTRIES: QaEntry[] = [
  {
    id: "qa-q1",
    question: "Who can join the knowledge hub programmes?",
    answer:
      "Any registered member. Guests can browse every listing here, but enrolment and the member libraries need a signed-in account.",
    answeredAt: "2026-06-02",
  },
  {
    id: "qa-q2",
    question: "Are the camp archive materials free to download?",
    answer:
      "Reading the summaries is open to everyone. Downloading the documents is a member feature while we connect the archive.",
    answeredAt: "2026-06-09",
  },
  {
    id: "qa-q3",
    question: "How do I suggest a course the hub does not list yet?",
    answer:
      "Course proposals start in the Youth Care board, where the education office collects them each term before planning.",
    answeredAt: "2026-06-16",
  },
  {
    id: "qa-q4",
    question: "Can I borrow books from the library catalogue without a membership?",
    answer:
      "Lending is reserved for members because the catalogue tracks borrowers. The browsing catalogue on this page is open to all.",
    answeredAt: "2026-06-23",
  },
  {
    id: "qa-q5",
    question: "What happens to a question asked in Youth Care?",
    answer:
      "It goes to the moderation queue, and once approved it appears on the board where any member can answer it.",
    answeredAt: "2026-07-01",
  },
];

// ---------------------------------------------------------------
// §5.2.9 Books Library — public catalogue, member download
// ---------------------------------------------------------------

export interface BookItem {
  id: string;
  title: string;
  author: string;
  abstract: string;
  assetId: string;
  fileType: "PDF" | "Word";
}

export const BOOKS: BookItem[] = [
  {
    id: "book-b1",
    title: "Letters to a Young Seeker",
    author: "Compiled by the Fit Family reading circle",
    abstract:
      "An anthology of short advisory letters collected from the circle's first three years of shared reading.",
    assetId: "book-b1",
    fileType: "PDF",
  },
  {
    id: "book-b2",
    title: "The Neighbourhood Mosque: A Field Guide",
    author: "Zaynab Abdullahi",
    abstract:
      "Architecture, routines and etiquette of the neighbourhood mosque, written as a walking tour.",
    assetId: "book-b2",
    fileType: "PDF",
  },
  {
    id: "book-b3",
    title: "Gardens of the Scholars",
    author: "Ahmad Fikri",
    abstract:
      "Twelve short biographies pairing scholars with the gardens, courtyards and libraries where they taught.",
    assetId: "book-b3",
    fileType: "Word",
  },
  {
    id: "book-b4",
    title: "A Beginner's Book of Patience",
    author: "Fit Family reading circle",
    abstract:
      "Practical chapters on waiting well — for results, for answers, and for seasons that seem slow.",
    assetId: "book-b4",
    fileType: "PDF",
  },
  {
    id: "book-b5",
    title: "Star Charts for Young Navigators",
    author: "Yusuf Karim",
    abstract:
      "The night-sky guide used at summer camps, with the navigation exercises from the astronomy elective.",
    assetId: "book-b5",
    fileType: "PDF",
  },
];

// ---------------------------------------------------------------
// §5.2.10 Video Library — public catalogue, member playback
// ---------------------------------------------------------------

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  durationLabel: string;
  topic: string;
  embedUrl: string;
}

/** Placeholder demo embed (Blender Foundation's open test film). */
const DEMO_EMBED_URL = "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ";

export const VIDEOS: VideoItem[] = [
  {
    id: "video-v1",
    title: "Study Circle Recap: Foundations of Tajwid, Week 1",
    description: "The opening lesson of the recitation course, recorded for members who missed the live circle.",
    durationLabel: "24 min",
    topic: "Courses",
    embedUrl: DEMO_EMBED_URL,
  },
  {
    id: "video-v2",
    title: "Camp Showcase Afternoon",
    description: "Highlights from the summer camp's closing showcase — every study group presents one project.",
    durationLabel: "38 min",
    topic: "Camps",
    embedUrl: DEMO_EMBED_URL,
  },
  {
    id: "video-v3",
    title: "Public Speaking Workshop: The First Minute",
    description: "Why the opening minute decides the audience, with three drills to practise at home.",
    durationLabel: "17 min",
    topic: "Courses",
    embedUrl: DEMO_EMBED_URL,
  },
  {
    id: "video-v4",
    title: "Library Tour and Shelving Walkthrough",
    description: "How the lending catalogue is organised, and where returned books wait for re-shelving.",
    durationLabel: "12 min",
    topic: "Library",
    embedUrl: DEMO_EMBED_URL,
  },
  {
    id: "video-v5",
    title: "Astronomy Elective: Reading the Night Sky",
    description: "The camp astronomy elective's introductory session on finding direction by starlight.",
    durationLabel: "31 min",
    topic: "Camps",
    embedUrl: DEMO_EMBED_URL,
  },
];

// ---------------------------------------------------------------
// §5.2.11 Recommended — public curated list
// ---------------------------------------------------------------

export interface RecommendedItem {
  id: string;
  title: string;
  type: "News" | "Announcement" | "Book" | "Video" | "Academic";
  href: string;
  summary: string;
}

export const RECOMMENDED: RecommendedItem[] = [
  {
    id: "rec-r1",
    title: "New term enrolment opens for Foundations of Tajwid",
    type: "News",
    href: "/news/n-1",
    summary: "The recitation course returns with two evening circles and a Saturday junior class.",
  },
  {
    id: "rec-r2",
    title: "Annual general meeting — agenda published",
    type: "Announcement",
    href: "/announcements/a-1",
    summary: "Committee reports, the year's accounts and the election procedure for open seats.",
  },
  {
    id: "rec-r3",
    title: "Letters to a Young Seeker",
    type: "Book",
    href: "/knowledge/books",
    summary: "The reading circle's anthology is the most-borrowed title of the past term.",
  },
  {
    id: "rec-r4",
    title: "Camp Showcase Afternoon",
    type: "Video",
    href: "/knowledge/videos",
    summary: "The closing showcase recording, now available in the member video library.",
  },
  {
    id: "rec-r5",
    title: "Peer Mentorship in Small Youth Associations",
    type: "Academic",
    href: "/knowledge/academic",
    summary: "The research circle's retention study, with findings discussed in the Youth Care board.",
  },
  {
    id: "rec-r6",
    title: "Winter Youth Camp — places and packing list",
    type: "Announcement",
    href: "/announcements/a-2",
    summary: "The winter camp announcement with the packing list the mentors actually endorse.",
  },
];

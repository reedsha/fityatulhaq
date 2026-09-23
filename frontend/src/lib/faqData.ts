/* MOCK — DELETE after Live API swap */

/**
 * Mock FAQ data — plain, server-safe module (no `"use client"` directive),
 * shaped identically to what the API will return.
 *
 * Ten entries across three categories, in first-seen order:
 * Membership (4), Programmes (3), Account & Access (3).
 * No real names, emails or fee amounts — answers stay deliberately general
 * until real copy arrives from the API.
 */

export interface FaqEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "faq-1",
    category: "Membership",
    question: "How do I join FityatulHaq?",
    answer:
      "Use the Register page to create a member account with your email address. Once your email is verified you can pick a programme and join your nearest branch. Registration takes about two minutes.",
  },
  {
    id: "faq-2",
    category: "Membership",
    question: "What are the benefits of membership?",
    answer:
      "Members can join any of our programmes, borrow from the Books Library, and take part in the annual camps. Membership also gives you a voice at the annual general meeting, where the committee is elected.",
  },
  {
    id: "faq-3",
    category: "Membership",
    question: "How much does membership cost?",
    answer:
      "Membership is free for all school-age members. Adult members are asked for a small annual contribution towards materials and camps; the exact amount is confirmed at registration and reviewed each year by the committee.",
  },
  {
    id: "faq-4",
    category: "Membership",
    question: "What age ranges do you accept?",
    answer:
      "Our programmes are open to young people roughly between the ages of 11 and 25, with activities grouped by age. Family members of any age are welcome through the Fit Family circle, and adult volunteers are always needed.",
  },
  {
    id: "faq-5",
    category: "Programmes",
    question: "Can I volunteer without becoming a member?",
    answer:
      "Yes. The Volunteers Network welcomes helpers who want to give time or skills without joining as full members. Register an account and mention volunteering when you contact the team, and a coordinator will be in touch.",
  },
  {
    id: "faq-6",
    category: "Programmes",
    question: "Who can attend the summer camp?",
    answer:
      "Camp places are open to registered members aged 11 and above, allocated across the branches. Places are limited each year, so applications usually open a few months in advance and are announced on the news page.",
  },
  {
    id: "faq-7",
    category: "Programmes",
    question: "How does the mentoring programme work?",
    answer:
      "Young members are matched with a trained volunteer mentor and meet regularly during the term. Matches are made by the programme coordinators based on age, interests and availability.",
  },
  {
    id: "faq-8",
    category: "Account & Access",
    question: "How do I create an account?",
    answer:
      "Open the Register page, enter your details and confirm the one-time verification code we email you. Once verified, your dashboard and member features unlock immediately.",
  },
  {
    id: "faq-9",
    category: "Account & Access",
    question: "I forgot my password. What should I do?",
    answer:
      "Open the Forgot password page and enter your email or username — we will send a one-time code that lets you set a new password. If the code does not arrive, check your spam folder or contact the support team.",
  },
  {
    id: "faq-10",
    category: "Account & Access",
    question: "How do I update my profile details?",
    answer:
      "Sign in and open your profile page, where you can change your full name, phone number and date of birth, and upload a profile photo. Your email address is fixed to your account to keep your login secure.",
  },
];

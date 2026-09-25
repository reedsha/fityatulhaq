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
    name: "คอร์สเรียน",
    blurb: "หลักสูตรแบบมีโครงสร้าง พร้อมบทเรียนแนะนำและการติดตามความก้าวหน้า",
    icon: "GraduationCap",
    membersOnly: false,
  },
  {
    id: "kc-camps",
    slug: "camps",
    name: "ค่าย",
    blurb: "คลังเก็บและทรัพยากรจากค่ายฤดูร้อนและฤดูหนาวประจำปีของเรา",
    icon: "Tent",
    membersOnly: false,
  },
  {
    id: "kc-papers",
    slug: "academic",
    name: "งานวิชาการ",
    blurb: "งานวิจัยและบทความที่สมาชิกและสถาบันพันธมิตรแบ่งปัน",
    icon: "FileText",
    membersOnly: true,
  },
  {
    id: "kc-encyclopedia",
    slug: "encyclopedia",
    name: "สารานุกรม",
    blurb: "หมวดอ้างอิงที่เติบโตอย่างต่อเนื่อง ครอบคลุมวิทยาศาสตร์ ประวัติศาสตร์ และวรรณคดี",
    icon: "Library",
    membersOnly: false,
  },
  {
    id: "kc-biography",
    slug: "biography",
    name: "ชีวประวัติ",
    blurb: "เรื่องราวชีวิตของนักวิชาการ ผู้นำ และผู้สร้างชุมชน",
    icon: "BookOpen",
    membersOnly: false,
  },
  {
    id: "kc-youth-advice",
    slug: "youth-advice",
    name: "คำแนะนำสำหรับเยาวชน",
    blurb: "คำแนะนำที่ใช้ได้จริง เขียนโดยเยาวชนเพื่อเยาวชน",
    icon: "Lightbulb",
    membersOnly: false,
  },
  {
    id: "kc-qa-corner",
    slug: "qa",
    name: "มุมถาม–ตอบ",
    blurb: "คำตอบจากชุมชนต่อคำถามที่สมาชิกถามบ่อยที่สุด",
    icon: "MessagesSquare",
    membersOnly: false,
  },
  {
    id: "kc-books",
    slug: "books",
    name: "ห้องสมุดหนังสือ",
    blurb: "แคตตาล็อกการยืม ตั้งแต่ตำราคลาสสิกจนถึงหนังสือสมัยใหม่",
    icon: "Book",
    membersOnly: true,
  },
  {
    id: "kc-videos",
    slug: "videos",
    name: "คลังวิดีโอ",
    blurb: "การบรรยายที่บันทึกไว้ ไฮไลต์ค่าย และบทเรียนแบบทีละขั้นตอน",
    icon: "Video",
    membersOnly: true,
  },
];

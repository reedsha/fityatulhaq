/* MOCK — DELETE after Live API swap */

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
    description: "ดำเนินโครงการสอนพิเศษร่วมกันสำหรับสาขาของสมาชิก",
    href: "https://example.org/partners/springfield-learning-trust",
    category: "การศึกษา",
  },
  {
    id: "p-2",
    name: "The Open Study Circle",
    description: "จัดกิจกรรมทบทวนบทเรียนช่วงสุดสัปดาห์ทั่วเมือง",
    href: "https://example.org/partners/open-study-circle",
    category: "การศึกษา",
  },
  {
    id: "p-3",
    name: "Riverside Tutorial College",
    description: "สนับสนุนที่นั่งเตรียมสอบสำหรับสมาชิกรุ่นพี่",
    href: "https://example.org/partners/riverside-tutorial-college",
    category: "การศึกษา",
  },
  {
    id: "p-4",
    name: "Meridian Book Fund",
    description: "จัดหาหนังสือเข้าห้องสมุดเป็นประจำทุกปี",
    href: "https://example.org/partners/meridian-book-fund",
    category: "การศึกษา",
  },
  {
    id: "p-5",
    name: "Springfield Community Centre",
    description: "สถานที่หลักสำหรับชมรมช่วงสุดสัปดาห์และการประชุมของเรา",
    href: "https://example.org/partners/springfield-community-centre",
    category: "ชุมชน",
  },
  {
    id: "p-6",
    name: "Neighbourhood Care Network",
    description: "ประสานปฏิทินกิจกรรมจิตอาสาร่วมของเรา",
    href: "https://example.org/partners/neighbourhood-care-network",
    category: "ชุมชน",
  },
  {
    id: "p-7",
    name: "City Volunteer Hub",
    description: "จับคู่สมาชิกกับโครงการบริการในท้องถิ่น",
    href: "https://example.org/partners/city-volunteer-hub",
    category: "ชุมชน",
  },
  {
    id: "p-8",
    name: "NextGen Mentoring Network",
    description: "ฝึกอบรมและจัดหาพี่เลี้ยงสำหรับรุ่นฤดูใบไม้ร่วงของเรา",
    href: "https://example.org/partners/nextgen-mentoring-network",
    category: "การพัฒนาเยาวชน",
  },
  {
    id: "p-9",
    name: "Harmony Youth Alliance",
    description: "พันธมิตรในโครงการกีฬาและค่ายระหว่างสาขา",
    href: "https://example.org/partners/harmony-youth-alliance",
    category: "การพัฒนาเยาวชน",
  },
  {
    id: "p-10",
    name: "The Future Builders Collective",
    description: "จัดกิจกรรมพัฒนาภาวะผู้นำช่วงสุดสัปดาห์สำหรับเยาวชนรุ่นพี่",
    href: "https://example.org/partners/future-builders-collective",
    category: "การพัฒนาเยาวชน",
  },
];

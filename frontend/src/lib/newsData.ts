/* MOCK — DELETE after Live API swap */

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
    title: "เปิดรับสมัครโครงการพี่เลี้ยงเยาวชนประจำฤดูใบไม้ร่วง",
    excerpt:
      "มีที่นั่งว่างห้าสิบที่ในสี่สาขาสำหรับฤดูใบไม้ร่วงนี้ ปิดรับสมัครภายในสิ้นเดือน และผู้ที่ผ่านการคัดเลือกจะได้รับการจับคู่กับพี่เลี้ยงภายในสองสัปดาห์",
    coverUrl: undefined,
    department: "โครงการเยาวชน",
    publishedAt: "2026-09-19T09:15:00Z",
    authorName: "Amina Rahman",
  },
  {
    id: "n-2",
    title: "จิตอาสาร่วมทาสีห้องอ่านหนังสือของชุมชน",
    excerpt:
      "สมาชิกกว่าสี่สิบคนมาร่วมกันในช่วงสุดสัปดาห์เพื่อทาสีและจัดชั้นหนังสือของห้องอ่านหนังสือที่ใช้โดยชมรมหลังเลิกเรียน",
    coverUrl: undefined,
    department: "กิจกรรมชุมชน",
    publishedAt: "2026-09-14T14:00:00Z",
    authorName: "Daniel Osei",
  },
  {
    id: "n-3",
    title: "เพิ่มสารานุกรมชุดใหม่สู่ห้องสมุดดิจิทัล",
    excerpt:
      "หนังสือใหม่สิบสองเล่มซึ่งครอบคลุมวิทยาศาสตร์ ประวัติศาสตร์ และวรรณกรรม พร้อมให้สมาชิกทุกคนเข้าถึงได้แล้วในคลังความรู้",
    coverUrl: undefined,
    department: "การศึกษา",
    publishedAt: "2026-09-08T08:30:00Z",
    authorName: "Sofia Marchetti",
  },
  {
    id: "n-4",
    title: "ที่ประชุมใหญ่สามัญประจำปี: เผยแพร่วาระและเอกสารประกอบ",
    excerpt:
      "วาระการประชุม บันทึกการประชุมปีที่แล้ว และงบการเงินที่ผ่านการตรวจสอบแล้ว พร้อมให้เข้าถึงก่อนการประชุมในเดือนตุลาคม",
    coverUrl: undefined,
    department: "องค์กร",
    publishedAt: "2026-09-02T16:45:00Z",
    authorName: "เลขานุการคณะกรรมการ",
  },
  {
    id: "n-5",
    title: "ไฮไลต์ค่ายฤดูร้อน: เยาวชน 120 คน สี่สาขา",
    excerpt:
      "ย้อนมองค่ายในปีนี้ ซึ่งจัดขึ้นในสี่พื้นที่และปิดท้ายด้วยกิจกรรมสังสรรค์ของชุมชนร่วมกัน",
    coverUrl: undefined,
    department: "โครงการเยาวชน",
    publishedAt: "2026-08-21T11:00:00Z",
    authorName: "Amina Rahman",
  },
  {
    id: "n-6",
    title: "ลงนามความร่วมมือกับสภาเยาวชนระดับภูมิภาค",
    excerpt:
      "ข้อตกลงระยะสองปีนี้เปิดทางให้ระดมทุนร่วมสำหรับการฝึกภาวะผู้นำ และให้สมาชิกของเราเข้าถึงสถานที่ของภูมิภาคได้",
    coverUrl: undefined,
    department: "องค์กร",
    publishedAt: "2026-08-12T10:20:00Z",
    authorName: "Daniel Osei",
  },
  {
    id: "n-7",
    title: "คลินิกคณิตศาสตร์วันเสาร์-อาทิตย์กลับมาในภาคเรียนใหม่",
    excerpt:
      "คลินิกที่ดำเนินการโดยจิตอาสาจะกลับมาเปิดอีกครั้งในวันเสาร์แรกของภาคเรียน โดยมีชั้นเรียนสำหรับผู้มีอายุ 11 ถึง 16 ปี",
    coverUrl: undefined,
    department: "การศึกษา",
    publishedAt: "2026-08-04T09:00:00Z",
    authorName: "Sofia Marchetti",
  },
  {
    id: "n-8",
    title: "การแข่งขันฟุตบอลการกุศลระดมทุนเข้ากองทุนหนังสือ",
    excerpt:
      "การแข่งขันระหว่างทีมรุ่นพี่และรุ่นน้องระดมทุนได้เพียงพอสำหรับซื้อหนังสือใหม่สองร้อยเล่ม",
    coverUrl: undefined,
    department: "กิจกรรมชุมชน",
    publishedAt: "2026-07-28T18:30:00Z",
    authorName: "Daniel Osei",
  },
];

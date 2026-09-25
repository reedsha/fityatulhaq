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
    title: "หลักพื้นฐานตัจญ์วีด",
    description:
      "ความรู้เบื้องต้นเกี่ยวกับกฎการอ่านอัลกุรอาน พร้อมวงฝึกปฏิบัติรายสัปดาห์และเซสชันทบทวนที่บันทึกไว้",
    startDate: "2026-10-05",
    difficulty: "Beginner",
    lessons: 12,
  },
  {
    id: "course-c2",
    title: "ภาษาอาหรับสำหรับผู้อ่าน",
    description:
      "คำศัพท์และไวยากรณ์สำหรับสมาชิกที่อยากอ่านตำราคลาสสิกด้วยพจนานุกรม ไม่ใช่ด้วยนักแปล",
    startDate: "2026-11-02",
    difficulty: "Intermediate",
    lessons: 16,
  },
  {
    id: "course-c3",
    title: "การพูดในที่สาธารณะสำหรับเยาวชน",
    description:
      "โครงสร้าง การนำเสนอ และการรับมือความตื่นเต้น — ชุดเวิร์กช็อปภาคปฏิบัติที่ปิดท้ายด้วยงานนำเสนอผลงานของชุมชนยามค่ำ",
    startDate: "2026-10-19",
    difficulty: "Beginner",
    lessons: 8,
  },
  {
    id: "course-c4",
    title: "คอร์สเข้มวิธีเรียน",
    description:
      "การทบทวนแบบเว้นช่วง ระบบจดบันทึก และการวางแผนสอบสำหรับนักเรียนรุ่นพี่ สอนโดยรุ่นพี่",
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
    title: "ค่ายความรู้ฤดูร้อน",
    summary:
      "เจ็ดวันกับวงเรียน กีฬา และกิจกรรมยามค่ำ ปิดท้ายด้วยช่วงบ่ายนำเสนอผลงานตามธรรมเนียม",
    startDate: "2025-07-14",
    endDate: "2025-07-20",
    location: "ศูนย์พักผ่อนฮิลล์เครสต์",
    season: "Summer",
  },
  {
    id: "camp-m2",
    title: "ค่ายเยาวชนฤดูหนาว",
    summary:
      "ค่ายในร่มระยะสั้นที่เน้นการจับคู่พี่เลี้ยง เวิร์กช็อป และการแข่งขันตอบคำถามประจำปี",
    startDate: "2025-12-22",
    endDate: "2025-12-26",
    location: "บ้านพักเลคไซด์",
    season: "Winter",
  },
  {
    id: "camp-m3",
    title: "ค่ายครอบครัวฤดูร้อน",
    summary:
      "ค่ายแรกที่เปิดรับผู้ปกครองร่วมกับเยาวชน — ทานอาหารร่วมกัน และมีหลักสูตรเรียนคู่ขนาน",
    startDate: "2026-07-13",
    endDate: "2026-07-19",
    location: "ศูนย์พักผ่อนฮิลล์เครสต์",
    season: "Summer",
  },
  {
    id: "camp-m4",
    title: "ค่ายทบทวนตนเองฤดูหนาว",
    summary:
      "ค่ายรูปแบบเงียบสงบ: เขียนบันทึกแบบมีผู้นำทาง อภิปรายกลุ่มเล็ก และวงทบทวนส่งท้ายปี",
    startDate: "2026-12-21",
    endDate: "2026-12-24",
    location: "บ้านไพน์แวลลีย์",
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
    title: "การเป็นพี่เลี้ยงโดยเพื่อนในสมาคมเยาวชนขนาดเล็ก",
    abstract:
      "งานวิจัยเชิงคุณภาพเกี่ยวกับรูปแบบการจับคู่ในสมาคมชุมชนสามแห่ง พร้อมผลการศึกษาการคงอยู่ตลอดสองปีการศึกษา",
    authors: "วงการศึกษาค้นคว้า โครงการ Fit Family",
    tags: ["การเป็นพี่เลี้ยง", "ชุมชน"],
    publishedAt: "2025-09-14",
    assetId: "paper-p1",
    fileType: "PDF",
  },
  {
    id: "paper-p2",
    title: "การสร้างสมดุลระหว่างการเรียนในโรงเรียนและการเรียนเสริม",
    abstract:
      "ข้อมูลแบบสอบถามจากสมาชิก 60 คนเกี่ยวกับภาระการเรียนรายสัปดาห์ พร้อมข้อเสนอแนะการจัดตารางเวลาสำหรับหลักสูตรในช่วงเปิดภาคเรียน",
    authors: "คณะทำงานฝ่ายการศึกษา",
    tags: ["วิธีเรียน", "สุขภาวะ"],
    publishedAt: "2026-01-20",
    assetId: "paper-p2",
    fileType: "PDF",
  },
  {
    id: "paper-p3",
    title: "การบริหารห้องสมุดชุมชนด้วยชั่วโมงจิตอาสา",
    abstract:
      "บันทึกการดำเนินงานสองปีของคลังหนังสือให้ยืม: ระบบจัดชั้นหนังสือ วินัยการกำหนดวันคืน และอัตราการสูญหาย",
    authors: "ทีมห้องสมุด",
    tags: ["ห้องสมุด", "จิตอาสา"],
    publishedAt: "2026-03-02",
    assetId: "paper-p3",
    fileType: "Word",
  },
  {
    id: "paper-p4",
    title: "หลักสูตรค่ายกับเครือข่ายมิตรภาพระยะยาว",
    abstract:
      "การสัมภาษณ์ติดตามผลกับศิษย์เก่าค่าย เพื่อดูว่ารูปแบบหลักสูตรใดสร้างเครือข่ายมิตรภาพที่ยั่งยืน",
    authors: "วงการศึกษาค้นคว้า โครงการ Fit Family",
    tags: ["ค่าย", "ชุมชน"],
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
    title: "ปฏิทินฮิจเราะฮ์",
    summary:
      "ปีจันทรคติทำงานอย่างไร ทำไมจึงคลาดเคลื่อนจากปฏิทินสุริยคติ และวันที่จัดค่ายในแต่ละปีถูกเลือกอย่างไร",
    tags: ["ประวัติศาสตร์", "เอกสารอ้างอิง"],
  },
  {
    id: "ency-e2",
    title: "พื้นฐานการอนุรักษ์เอกสารโบราณ",
    summary:
      "อุณหภูมิ แสง และการจับต้อง — คู่มือเบื้องต้นว่าทำไมหนังสือเก่าจึงได้รับการดูแลในแบบที่เป็นอยู่",
    tags: ["ห้องสมุด", "เอกสารอ้างอิง"],
  },
  {
    id: "ency-e3",
    title: "ภูมิศาสตร์ฉบับย่อของเมืองบนเส้นทางสายไหม",
    summary:
      "หกเมืองที่หล่อหลอมเส้นทางค้าขายทางวิชาการ พร้อมแผนที่ที่วงเรียนของเราใช้",
    tags: ["ภูมิศาสตร์", "ประวัติศาสตร์"],
  },
  {
    id: "ency-e4",
    title: "น้ำในสวนทะเลทราย",
    summary:
      "วิธีการชลประทานแบบดั้งเดิม และสิ่งที่สวนชุมชนสมัยใหม่นำมาปรับใช้",
    tags: ["วิทยาศาสตร์"],
  },
  {
    id: "ency-e5",
    title: "เครื่องมือการเขียนอักษรวิจิตร",
    summary:
      "ปากกากอไม้ แผ่นหมึก และมีด — คำศัพท์พร้อมภาพประกอบของโต๊ะนักเขียนอักษรวิจิตร",
    tags: ["ศิลปะ", "เอกสารอ้างอิง"],
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
    field: "การศึกษา",
    summary:
      "ครูหมู่บ้านที่ปั้นโรงเรียนตอนค่ำให้เติบโตเป็นสถาบันเต็มเวลา เล่าผ่านบันทึกของลูกศิษย์",
    initials: "AF",
  },
  {
    id: "bio-b2",
    name: "Dr. Maryam Suleiman",
    field: "การแพทย์",
    summary:
      "คลินิกชุมชนที่ก่อตั้งขึ้นดำเนินมา 30 ปี และฝึกพยาบาลจิตอาสาสองรุ่น",
    initials: "MS",
  },
  {
    id: "bio-b3",
    name: "Hafiz Yusuf Karim",
    field: "การอ่านอัลกุรอาน",
    summary:
      "จากวงเรียนในเมืองเล็กสู่การแข่งขันระดับนานาชาติ — แล้วกลับบ้านมาสอนชั้นเรียนผู้เริ่มต้น",
    initials: "YK",
  },
  {
    id: "bio-b4",
    name: "Zaynab Abdullahi",
    field: "ภาวะผู้นำชุมชน",
    summary:
      "ผู้อยู่เบื้องหลังความร่วมมือเมืองพี่เมืองน้องของสมาคมเรา และโครงการระดมหนังสือประจำปี",
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
    title: "เริ่มภาคเรียนใหม่โดยไม่หมดไฟ",
    topic: "วิธีเรียน",
    paragraphs: [
      "สองสัปดาห์แรกกำหนดจังหวะของทั้งภาคเรียน เลือกช่วงเวลาอ่านหนังสือประจำสองช่วง แล้วปกป้องมันไว้ก่อนที่ตารางจะเต็มไปด้วยอย่างอื่น",
      "จดช่วงเวลาเหล่านั้นไว้ในที่ที่คุณวางแผนสัปดาห์ ไม่ใช่ในที่ที่คุณวางแผนเป้าหมาย — แผนที่มองไม่เห็นในคืนวันอังคารไม่ใช่แผน",
      "สุดท้าย เลือกหนึ่งเย็นต่อสัปดาห์ที่ไม่มีตารางอะไรเลย การพักที่วางแผนไว้จะเกิดขึ้นจริง ส่วนการพักที่ได้เฉพาะตอนเหลือเวลาจะไม่รอด",
    ],
  },
  {
    id: "advice-a2",
    title: "วิธีถามคำถามที่คุณคิดว่ามันง่ายเกินไป",
    topic: "ชุมชน",
    paragraphs: [
      "วงเรียนทุกวงมีคำถามหนึ่งข้อที่ไม่มีใครถาม เพราะทุกคนคิดว่าคนอื่นรู้คำตอบ หลายครั้ง ทุกคนต่างคิดแบบเดียวกันหมด",
      "จดคำถามไว้ก่อนหมดเวลาเรียน แล้วส่งให้ผู้นำวงแบบไม่ระบุชื่อหากต้องการ วงเรียนส่วนใหญ่ตอบคำถามที่เขียนไว้ก่อนด้วยเหตุผลนี้เอง",
      "วิธีที่เร็วที่สุดที่จะรู้ว่าคำถามนั้นไม่ได้ง่ายเกินไป: ลองถาม แล้วนับว่ามีคนจดคำตอบกี่คน",
    ],
  },
  {
    id: "advice-a3",
    title: "การเป็นจิตอาสาในวันที่ตารางแน่นเต็ม",
    topic: "จิตอาสา",
    paragraphs: [
      "จิตอาสาไม่ใช่ตารางเรียนที่สอง เลือกงานเล็ก ๆ ที่ทำซ้ำและชุมชนต้องการจริง ๆ — จัดชั้นหนังสือ วางเก้าอี้ หรือต้อนรับที่ประตู",
      "งานเล็กที่ทำทุกสัปดาห์ดีกว่างานใหญ่ที่ทำครั้งเดียว คณะกรรมการวางแผนต่อได้เมื่อรู้ว่าอะไรเชื่อถือได้",
      "บอกผู้ประสานงานถึงกำลังที่ทำได้จริง รวมถึงช่วงสอบ จิตอาสาที่พูดว่า 'ธันวาคมไม่ว่าง' คือจิตอาสาที่ยังอยู่ตรงนั้นในเดือนมกราคม",
    ],
  },
  {
    id: "advice-a4",
    title: "เตรียมตัวสำหรับค่ายครั้งแรกของคุณ",
    topic: "ค่าย",
    paragraphs: [
      "เก็บกระเป๋าตามตารางกิจกรรม ไม่ใช่ตามพยากรณ์อากาศ: เสื้อกันหนาวหนึ่งตัวสำหรับกิจกรรมกลางคืน และเสื้อผ้าหนึ่งชุดที่ไม่เสียดายถ้าเปื้อนสี",
      "พกสมุดบันทึกเล่มที่คุณชอบจริง ๆ คุณจะจดจนเต็มเร็วเกินคาด",
      "แนะนำตัวกับใครสักคนก่อนมื้อแรก มิตรภาพในค่ายเกือบทั้งหมดเริ่มจากในคิว ไม่ใช่ในห้องกิจกรรม",
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
    question: "ใครสามารถเข้าร่วมหลักสูตรของคลังความรู้ได้บ้าง",
    answer:
      "สมาชิกที่ลงทะเบียนทุกคน แขกสามารถเรียกดูรายการทั้งหมดได้ แต่การลงทะเบียนเรียนและคลังสำหรับสมาชิกต้องใช้บัญชีที่เข้าสู่ระบบแล้ว",
    answeredAt: "2026-06-02",
  },
  {
    id: "qa-q2",
    question: "เอกสารคลังค่ายดาวน์โหลดได้ฟรีหรือไม่",
    answer:
      "การอ่านบทสรุปเปิดให้ทุกคน ส่วนการดาวน์โหลดเอกสารเป็นสิทธิ์ของสมาชิกในระหว่างที่เรากำลังเชื่อมต่อคลังข้อมูล",
    answeredAt: "2026-06-09",
  },
  {
    id: "qa-q3",
    question: "ฉันจะเสนอหลักสูตรที่คลังความรู้ยังไม่มีได้อย่างไร",
    answer:
      "ข้อเสนอหลักสูตรเริ่มต้นที่บอร์ดดูแลเยาวชน ซึ่งฝ่ายการศึกษาจะรวบรวมทุกภาคเรียนก่อนวางแผน",
    answeredAt: "2026-06-16",
  },
  {
    id: "qa-q4",
    question: "ฉันสามารถยืมหนังสือจากคลังห้องสมุดได้โดยไม่เป็นสมาชิกหรือไม่",
    answer:
      "การยืมสงวนไว้สำหรับสมาชิก เพราะคลังหนังสือมีการติดตามผู้ยืม ส่วนรายการที่เรียกดูได้ในหน้านี้เปิดให้ทุกคน",
    answeredAt: "2026-06-23",
  },
  {
    id: "qa-q5",
    question: "คำถามที่ถามในบอร์ดดูแลเยาวชนจะเกิดอะไรขึ้น",
    answer:
      "คำถามจะเข้าสู่คิวตรวจสอบ และเมื่อได้รับอนุมัติจะปรากฏบนบอร์ดให้สมาชิกทุกคนตอบได้",
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
    title: "จดหมายถึงผู้แสวงหาหนุ่มสาว",
    author: "รวบรวมโดยวงอ่านหนังสือ Fit Family",
    abstract:
      "รวมจดหมายให้คำปรึกษาฉบับสั้นที่คัดจากสามปีแรกของการอ่านร่วมกันของวง",
    assetId: "book-b1",
    fileType: "PDF",
  },
  {
    id: "book-b2",
    title: "มัสยิดในละแวกบ้าน: คู่มือภาคสนาม",
    author: "Zaynab Abdullahi",
    abstract:
      "สถาปัตยกรรม กิจวัตร และมารยาทของมัสยิดในละแวกบ้าน เขียนในรูปแบบการเดินชมสถานที่",
    assetId: "book-b2",
    fileType: "PDF",
  },
  {
    id: "book-b3",
    title: "สวนของเหล่านักปราชญ์",
    author: "Ahmad Fikri",
    abstract:
      "ชีวประวัติสั้นสิบสองเรื่องที่เชื่อมนักปราชญ์เข้ากับสวน ลาน และห้องสมุดที่พวกเขาสอน",
    assetId: "book-b3",
    fileType: "Word",
  },
  {
    id: "book-b4",
    title: "หนังสือความอดทนสำหรับผู้เริ่มต้น",
    author: "วงอ่านหนังสือ Fit Family",
    abstract:
      "บทฝึกปฏิบัติเรื่องการรออย่างดี — รอผลลัพธ์ รอคำตอบ และรอฤดูกาลที่ดูเหมือนผ่านไปช้า",
    assetId: "book-b4",
    fileType: "PDF",
  },
  {
    id: "book-b5",
    title: "แผนที่ดาวสำหรับนักเดินเรือรุ่นเยาว์",
    author: "Yusuf Karim",
    abstract:
      "คู่มือท้องฟ้ายามค่ำคืนที่ใช้ในค่ายฤดูร้อน พร้อมแบบฝึกการเดินเรือจากวิชาเลือกดาราศาสตร์",
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
    title: "สรุปวงเรียน: พื้นฐานตัจญ์วีด สัปดาห์ที่ 1",
    description: "บทเรียนเปิดของหลักสูตรการอ่านอัลกุรอาน บันทึกไว้สำหรับสมาชิกที่พลาดวงเรียนสด",
    durationLabel: "24 นาที",
    topic: "หลักสูตร",
    embedUrl: DEMO_EMBED_URL,
  },
  {
    id: "video-v2",
    title: "ช่วงบ่ายนำเสนอผลงานค่าย",
    description: "ไฮไลต์จากงานนำเสนอปิดค่ายฤดูร้อน — วงเรียนแต่ละวงนำเสนอผลงานหนึ่งชิ้น",
    durationLabel: "38 นาที",
    topic: "ค่าย",
    embedUrl: DEMO_EMBED_URL,
  },
  {
    id: "video-v3",
    title: "เวิร์กช็อปการพูดในที่สาธารณะ: นาทีแรก",
    description: "ทำไมนาทีเปิดจึงชี้ขาดผู้ฟัง พร้อมแบบฝึกสามชุดให้ซ้อมที่บ้าน",
    durationLabel: "17 นาที",
    topic: "หลักสูตร",
    embedUrl: DEMO_EMBED_URL,
  },
  {
    id: "video-v4",
    title: "พาชมห้องสมุดและสาธิตการจัดชั้นหนังสือ",
    description: "คลังหนังสือให้ยืมจัดเรียงอย่างไร และหนังสือที่คืนแล้วรอจัดเข้าชั้นตรงไหน",
    durationLabel: "12 นาที",
    topic: "ห้องสมุด",
    embedUrl: DEMO_EMBED_URL,
  },
  {
    id: "video-v5",
    title: "วิชาเลือกดาราศาสตร์: การอ่านท้องฟ้ายามค่ำคืน",
    description: "คาบแนะนำของวิชาเลือกดาราศาสตร์ในค่าย ว่าด้วยการหาทิศทางด้วยแสงดาว",
    durationLabel: "31 นาที",
    topic: "ค่าย",
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
    title: "เปิดรับสมัครภาคเรียนใหม่สำหรับพื้นฐานตัจญ์วีด",
    type: "News",
    href: "/news/n-1",
    summary: "หลักสูตรการอ่านอัลกุรอานกลับมาพร้อมวงเรียนช่วงเย็นสองวง และชั้นเรียนรุ่นน้องวันเสาร์",
  },
  {
    id: "rec-r2",
    title: "การประชุมใหญ่สามัญประจำปี — เผยแพร่วาระแล้ว",
    type: "Announcement",
    href: "/announcements/a-1",
    summary: "รายงานของคณะกรรมการ งบการเงินประจำปี และขั้นตอนการเลือกตั้งสำหรับตำแหน่งที่ว่าง",
  },
  {
    id: "rec-r3",
    title: "จดหมายถึงผู้แสวงหาหนุ่มสาว",
    type: "Book",
    href: "/knowledge/books",
    summary: "รวมจดหมายของวงอ่านหนังสือเป็นหนังสือที่ถูกยืมมากที่สุดในภาคเรียนที่ผ่านมา",
  },
  {
    id: "rec-r4",
    title: "ช่วงบ่ายนำเสนอผลงานค่าย",
    type: "Video",
    href: "/knowledge/videos",
    summary: "บันทึกงานนำเสนอปิดค่าย พร้อมให้ชมแล้วในคลังวิดีโอสำหรับสมาชิก",
  },
  {
    id: "rec-r5",
    title: "การเป็นพี่เลี้ยงโดยเพื่อนในสมาคมเยาวชนขนาดเล็ก",
    type: "Academic",
    href: "/knowledge/academic",
    summary: "งานศึกษาการคงอยู่ของวงการศึกษาค้นคว้า โดยผลการวิจัยถูกอภิปรายในบอร์ดดูแลเยาวชน",
  },
  {
    id: "rec-r6",
    title: "ค่ายเยาวชนฤดูหนาว — ที่นั่งและรายการของที่ต้องเตรียม",
    type: "Announcement",
    href: "/announcements/a-2",
    summary: "ประกาศค่ายฤดูหนาวพร้อมรายการสิ่งของที่พี่เลี้ยงรับรองจริง ๆ",
  },
];

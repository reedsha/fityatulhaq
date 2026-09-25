import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import KnowledgeCategoryContent from "@/components/knowledge/KnowledgeCategoryContent";
import { KNOWLEDGE_CATEGORIES } from "@/lib/knowledgeData";

/**
 * `/knowledge/[category]` — one of the ten knowledge-hub collections
 * (PRD §5.2.2–§5.2.11), served statically from the shared mock data.
 *
 * The shell mirrors `app/news/[slug]/page.tsx`: it resolves the slug against
 * the server-safe data module, composes the dark header band, and hands the
 * list rendering to the client `KnowledgeCategoryContent` switch. Unknown
 * slugs render a graceful not-found block inside the standard chrome.
 */

interface KnowledgeCategoryRouteProps {
  params: Promise<{ category: string }>;
}

/** "recommended" is a standalone route (§5.2.11), not a KnowledgeCategory. */
const RECOMMENDED_SLUG = "recommended";

const CATEGORY_ROUTES: Array<{ slug: string; name: string }> = [
  ...KNOWLEDGE_CATEGORIES.map((category) => ({ slug: category.slug, name: category.name })),
  { slug: RECOMMENDED_SLUG, name: "รายการคัดสรร" },
];

export function generateStaticParams(): Array<{ category: string }> {
  return CATEGORY_ROUTES.map((route) => ({ category: route.slug }));
}

export async function generateMetadata({
  params,
}: KnowledgeCategoryRouteProps): Promise<Metadata> {
  const { category } = await params;
  const route = CATEGORY_ROUTES.find((entry) => entry.slug === category);

  if (route === undefined) {
    return {
      title: "ไม่พบหน้านี้ | คลังความรู้",
      description: "ไม่พบคอลเลกชันความรู้นี้",
    };
  }

  const categoryEntry = KNOWLEDGE_CATEGORIES.find((entry) => entry.slug === category);
  const description =
    categoryEntry?.blurb ?? "คัดสรรจากทั่วทั้งคลังความรู้ FityatulHaq";

  return {
    title: `${route.name} | คลังความรู้`,
    description,
  };
}

/** Focus treatment inlined because `Header.tsx` is a client module — its string
 * exports cannot be imported into this server component. Keep in sync with
 * `FOCUS_RING_DARK` there. */
const BAND_FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950";

const CATEGORY_INTROS: Record<string, string> = {
  courses: "หลักสูตรแบบมีโครงสร้าง พร้อมบทเรียนแนะนำ — รายละเอียดการลงทะเบียนอยู่ในแต่ละการ์ดคอร์ส",
  camps: "คลังเก็บและทรัพยากรจากค่ายฤดูร้อนและฤดูหนาวประจำปีของเรา",
  academic: "งานวิจัยและบทความที่สมาชิกและสถาบันพันธมิตรแบ่งปัน",
  encyclopedia: "หมวดอ้างอิงที่เติบโตอย่างต่อเนื่อง ครอบคลุมวิทยาศาสตร์ ประวัติศาสตร์ และวรรณคดี",
  biography: "เรื่องราวชีวิตของนักวิชาการ ผู้นำ และผู้สร้างชุมชน",
  "youth-advice": "คำแนะนำที่ใช้ได้จริง เขียนโดยเยาวชนเพื่อเยาวชน",
  qa: "คำตอบจากชุมชนต่อคำถามที่สมาชิกถามบ่อยที่สุด",
  books: "แคตตาล็อกการยืม ตั้งแต่ตำราคลาสสิกจนถึงหนังสือสมัยใหม่",
  videos: "การบรรยายที่บันทึกไว้ ไฮไลต์ค่าย และบทเรียนแบบทีละขั้นตอน",
  recommended: "รายการคัดสรรโดยคณะกรรมการจากทั่วทั้งคลังความรู้และเว็บไซต์",
};

function categoryIntro(slug: string): string {
  return CATEGORY_INTROS[slug] ?? "เรียกดูคอลเลกชันความรู้นี้";
}

function CategoryNotFound(): ReactElement {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-brand-950">
      <section
        aria-label="ไม่พบคอลเลกชัน"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8"
      >
        <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          ไม่พบคอลเลกชัน
        </h1>
        <p className="mt-3 max-w-md text-body text-ink-300">
          คอลเลกชันความรู้นี้ไม่มีอยู่ หรืออาจถูกย้ายไปแล้ว
        </p>
        <Link
          href="/knowledge"
          className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${BAND_FOCUS_RING}`}
        >
          ← กลับไปที่คลังความรู้
        </Link>
      </section>
    </div>
  );
}

export default async function KnowledgeCategoryRoute({
  params,
}: KnowledgeCategoryRouteProps): Promise<ReactElement> {
  const { category } = await params;
  const route = CATEGORY_ROUTES.find((entry) => entry.slug === category);

  if (route === undefined) {
    return (
      <AuthAwareShell contained={false}>
        <CategoryNotFound />
      </AuthAwareShell>
    );
  }

  const categoryEntry = KNOWLEDGE_CATEGORIES.find((entry) => entry.slug === category);

  return (
    <AuthAwareShell contained={false}>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0c1017]">
        {/* ── Header band ──────────────────────────────────────────── */}
        <header className="relative isolate overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
          />

          <div className="relative mx-auto max-w-6xl">
            <nav aria-label="เส้นทางนำทาง" className="text-caption text-ink-400">
              <Link
                href="/"
                className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${BAND_FOCUS_RING}`}
              >
                หน้าแรก
              </Link>
              <span aria-hidden="true" className="mx-2">
                /
              </span>
              <Link
                href="/knowledge"
                className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${BAND_FOCUS_RING}`}
              >
                คลังความรู้
              </Link>
              <span aria-hidden="true" className="mx-2">
                /
              </span>
              <span aria-current="page" className="text-ink-200">
                {route.name}
              </span>
            </nav>

            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
              {route.name}
            </h1>
            <p className="mt-3 max-w-xl text-body text-ink-300">{categoryIntro(category)}</p>

            {categoryEntry?.membersOnly ? (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50/10 px-3 py-1 text-caption font-semibold text-accent-300">
                ทุกคนเรียกดูได้ — การดาวน์โหลดต้องมีบัญชีสมาชิก
              </p>
            ) : null}
          </div>
        </header>

        {/* ── Collection content ───────────────────────────────────── */}
        <main className="flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <KnowledgeCategoryContent slug={category} />
          </div>
        </main>
      </div>
    </AuthAwareShell>
  );
}

"use client";

import Link from "next/link";
import {
  BookOpen,
  Eye,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { ReactElement } from "react";

import { FOCUS_RING, FOCUS_RING_DARK } from "@/components/layout/Header";

/* ====================================================================
   ABOUT — /about
   ====================================================================

   Visual language: the /news and /announcements page frame — dark band
   header (`bg-brand-950` + gradient), content on the `#0c1017` band with
   white `shadow-card` cards, lime `bg-accent-300` pills, ink-* text
   tokens — so About reads as part of the same site as the dashboard.

   Site chrome (header, skip link, footer) is supplied by the route shell
   in `app/about/page.tsx` via `AuthAwareShell`; this file renders content
   only, so it must not introduce a second `<main>`.
   ==================================================================== */

// ---------------------------------------------------------------
// Mission & vision cards
// ---------------------------------------------------------------

interface StatementCardProps {
  icon: LucideIcon;
  title: string;
  body: string;
}

function StatementCard(props: StatementCardProps): ReactElement {
  const { icon: Icon, title, body } = props;

  return (
    <article className="flex flex-col rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <span
        aria-hidden="true"
        className="h-1 w-10 rounded-full bg-accent-300"
      />
      <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-300/15 text-brand-700">
        <Icon aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-heading-4 text-ink-900">{title}</h2>
      <p className="mt-2 text-body-sm leading-relaxed text-ink-600">{body}</p>
    </article>
  );
}

// ---------------------------------------------------------------
// "What we do" pillar cards — dashboard category-card rotation
// ---------------------------------------------------------------

type PillarTone = "lime" | "pale" | "white";

const PILLAR_TONE_CLASSES: Record<PillarTone, { card: string; title: string; body: string }> = {
  lime: {
    card: "bg-accent-300",
    title: "text-ink-900",
    body: "text-brand-950/80",
  },
  pale: {
    card: "bg-brand-50",
    title: "text-brand-800",
    body: "text-brand-700",
  },
  white: {
    card: "bg-white",
    title: "text-ink-900",
    body: "text-ink-600",
  },
};

interface Pillar {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: PillarTone;
}

const PILLARS: Pillar[] = [
  {
    icon: GraduationCap,
    title: "การพัฒนาเยาวชน",
    description: "กิจกรรมพี่เลี้ยง ค่าย และการฝึกภาวะผู้นำสำหรับสมาชิกอายุ 11 ถึง 25 ปี",
    tone: "lime",
  },
  {
    icon: BookOpen,
    title: "การศึกษาและความรู้",
    description: "ชมรมเรียน ห้องสมุดดิจิทัล และสารานุกรมที่เปิดให้สมาชิกทุกคน",
    tone: "pale",
  },
  {
    icon: HeartHandshake,
    title: "การบริการชุมชน",
    description: "โครงการจิตอาสาที่นำสมาชิกไปทำงานเพื่อชุมชนรอบข้าง",
    tone: "white",
  },
  {
    icon: Megaphone,
    title: "การสื่อสารและเผยแพร่",
    description: "ข่าวสาร ประกาศอย่างเป็นทางการ และเว็บบอร์ดที่เชื่อมเครือข่ายให้ใกล้ชิดกัน",
    tone: "pale",
  },
];

function PillarCard({ pillar }: { pillar: Pillar }): ReactElement {
  const Icon = pillar.icon;
  const tone = PILLAR_TONE_CLASSES[pillar.tone];

  return (
    <article className={`flex flex-col rounded-2xl p-5 shadow-card ${tone.card}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded bg-ink-950/10">
        <Icon aria-hidden="true" strokeWidth={1.75} className={`h-5 w-5 ${tone.title}`} />
      </div>
      <h3 className={`mt-3 text-heading-4 ${tone.title}`}>{pillar.title}</h3>
      <p className={`mt-2 text-body-sm leading-relaxed ${tone.body}`}>{pillar.description}</p>
    </article>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default function AboutPage(): ReactElement {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0c1017]">
      {/* ── Header band ──────────────────────────────────────────────── */}
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
          {/* Breadcrumb */}
          <nav aria-label="เส้นทางนำทาง" className="text-caption text-ink-400">
            <Link
              href="/"
              className={`rounded-sm transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-300 ${FOCUS_RING_DARK}`}
            >
              หน้าแรก
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-ink-200">
              เกี่ยวกับเรา
            </span>
          </nav>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            เกี่ยวกับเรา
          </h1>
          <p className="mt-3 max-w-xl text-body text-ink-300">
            องค์กรพัฒนาเยาวชนที่สนับสนุนคนรุ่นใหม่ผ่านการเรียนรู้ ชุมชน และการรับใช้สังคม
          </p>
        </div>
      </header>

      {/* ── Mission & Vision ─────────────────────────────────────────── */}
      <section aria-label="พันธกิจและวิสัยทัศน์" className="px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
          <StatementCard
            icon={Target}
            title="พันธกิจของเรา"
            body="หล่อหลอมเยาวชนให้มีวินัย รู้รอบ และมีจิตสาธารณะ — เสริมสร้างอุปนิสัย ทักษะ และโอกาสให้สมาชิกทุกคนก้าวเป็นผู้นำในชุมชนของตน"
          />
          <StatementCard
            icon={Eye}
            title="วิสัยทัศน์ของเรา"
            body="สร้างคนรุ่นใหม่ที่ยืนหยัดเพื่อความดี — มั่นใจในตัวตนของตนเอง เอื้อเฟื้อในการรับใช้ และได้รับการยอมรับว่าเป็นพลังบวกของสังคม"
          />
        </div>
      </section>

      {/* ── Our History ──────────────────────────────────────────────── */}
      <section aria-label="ประวัติของเรา" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-heading-3 text-white">ประวัติของเรา</h2>

          {/* Opening statement carries the lime accent bar. */}
          <p className="mt-5 border-l-4 border-accent-300 pl-6 text-lg leading-relaxed text-ink-100">
            ฟิตยะตุลฮักเริ่มต้นในปี 2554 จากวงเรียนช่วงสุดสัปดาห์เล็ก ๆ ที่ดำเนินการโดยครูจิตอาสา
            ใช้ห้องเรียนที่ยืมมาร่วมกับนักเรียนสิบห้าคน
          </p>

          <p className="mt-5 text-body leading-relaxed text-ink-300">
            ภายในสามปี วงเรียนนี้เติบโตเป็นสมาคมเยาวชนจดทะเบียนที่มีสาขาในสี่จังหวัด
            และค่ายฤดูร้อนครั้งแรกได้รวมเยาวชนสองร้อยคนไว้ด้วยกันเป็นเวลาหนึ่งสัปดาห์
            เพื่อเรียนรู้ เล่นกีฬา และบำเพ็ญประโยชน์
          </p>
          <p className="mt-4 text-body leading-relaxed text-ink-300">
            ปัจจุบันองค์กรดำเนินโครงการพี่เลี้ยง ห้องสมุดดิจิทัล และโครงการบริการชุมชนที่สมาชิกคุ้นเคย
            — ยังคงขับเคลื่อนด้วยจิตอาสาเป็นหัวใจ และยังบริหารโดยคณะกรรมการที่มาจากการเลือกตั้งในที่ประชุมใหญ่สามัญประจำปี
          </p>
          <p className="mt-4 text-body leading-relaxed text-ink-300">
            สิบห้าปีผ่านไป จุดมุ่งหมายของเราไม่เคยเปลี่ยน: เพื่อสร้างคนรุ่นใหม่ที่ยืนหยัดเพื่อความดี
            และมอบพื้นที่ให้เยาวชนทุกคนได้เรียนรู้ เติบโต และรับใช้สังคมร่วมกัน
          </p>
        </div>
      </section>

      {/* ── What We Do ───────────────────────────────────────────────── */}
      <section aria-label="สิ่งที่เราทำ" className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-heading-3 text-white">สิ่งที่เราทำ</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar) => (
              <PillarCard key={pillar.title} pillar={pillar} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership CTA ───────────────────────────────────────────── */}
      <section
        aria-label="พบกับคณะกรรมการ"
        className="relative isolate mt-12 overflow-hidden bg-brand-950 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-brand-700/40 via-transparent to-accent-300/10"
        />

        <div className="relative mx-auto max-w-6xl text-center">
          <h2 className="text-heading-3 text-white">ผู้บริหารของเรา</h2>
          <p className="mx-auto mt-2 max-w-xl text-body text-ink-300">
            คณะกรรมการมาจากการเลือกตั้งของสมาชิกในที่ประชุมใหญ่สามัญประจำปี
            และมีวาระการดำรงตำแหน่งสองปี
          </p>
          <Link
            href="/about/committee"
            className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-6 py-2.5 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING_DARK}`}
          >
            พบกับคณะกรรมการ
          </Link>
        </div>
      </section>
    </div>
  );
}

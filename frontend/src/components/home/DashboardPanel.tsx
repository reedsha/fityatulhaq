"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

import banatImg from "@/assets/image/banat.jpg";
import fitfamilyImg from "@/assets/image/fitfamily.jpg";
import tmydaImg from "@/assets/image/tmyda.png";
import { FOCUS_RING_DARK } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────────────────────────────────────────────────────────────────
   CHROME NOTE — the previous inline navbar strip (Section 1) and blue footer
   (Section 8) were removed: this panel now renders content only, and the
   global `Header` / `Footer` are composited around it by `AuthAwareShell` →
   `PageShell` in `app/page.tsx` (the site root), exactly like every other page.
   Do not re-add header or footer markup here — it would duplicate the shell.
───────────────────────────────────────────────────────────────────────────── */

/**
 * The site's landing page — PUBLIC per PRD §5.1.1: guests browse every section
 * and are greeted with the register/login CTAs in the hero, while signed-in
 * members see their name once the session resolves. Nothing here gates or
 * redirects — only member-only ACTIONS elsewhere in the app require a session
 * (§6.4), and those hand back through `/login?next=…`.
 *
 * Promoted from `/dashboard` to `/` when the two routes were unified; the
 * `DashboardPanel` name is kept so the promotion stays traceable in history.
 */
export function DashboardPanel(): ReactElement {
  const { user } = useAuth();

  /* ─────────────────────────────────────────────────────────────────────────
     REFERENCE-DESIGN LAYOUT (rendered immediately for guests and members)
     Section order (top → bottom):
       2. Hero banner
       3. Vivid blue ticker bar
       4. Category cards (lime / pale-blue / pink)
       5. News + Announcements grid
       6. Webboard speech-bubble section
       7. Stats row
     (Header and Footer are supplied by the global shell.)
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-brand-950 font-sans">

      {/* ── 2. HERO BANNER ────────────────────────────────────────────── */}
      <section
        aria-label="แบนเนอร์หลัก"
        className="relative isolate overflow-hidden"
        style={{ minHeight: "420px" }}
      >
        {/* Dark gradient sky backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950"
        />

        {/* Decorative radial glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(100,160,255,0.18),transparent)]"
        />

        {/* Silhouette figure (CSS-only) */}
        <div aria-hidden="true" className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <div
            className="h-64 w-40 opacity-80"
            style={{
              background: "linear-gradient(to top, #0c1017 0%, transparent 100%)",
              clipPath:
                "polygon(50% 0%, 44% 12%, 30% 10%, 36% 25%, 20% 30%, 40% 35%, 38% 55%, 28% 55%, 20% 100%, 80% 100%, 72% 55%, 62% 55%, 60% 35%, 80% 30%, 64% 25%, 70% 10%, 56% 12%)",
            }}
          />
        </div>

        {/* Hero text */}
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-20 text-center">
          <h1 className="text-3xl font-extrabold leading-snug text-white drop-shadow-lg sm:text-4xl md:text-5xl">
            จงลุกขึ้นสู่การปฏิรูปตนเอง และเรียกร้องสู่ความดีแก่
            <br />
            <span className="text-[#b2f35e]">สู่การยอมจำนนต่อพระเจ้า</span>
          </h1>
          <p className="mt-4 text-body text-ink-300">
            {user !== null ? (
              <>
                ยินดีต้อนรับ,{" "}
                <span className="font-semibold text-white">{user?.fullName ?? ""}</span>
              </>
            ) : (
              <>
                ยินดีต้อนรับ —{" "}
                <Link
                  href="/register"
                  className={`font-semibold text-accent-300 underline underline-offset-4 transition duration-fast ease-standard motion-reduce:transition-none hover:text-ink-50 ${FOCUS_RING_DARK}`}
                >
                  ร่วมเป็นสมาชิก
                </Link>
                <span aria-hidden="true"> · </span>
                <Link
                  href="/login"
                  className={`font-semibold text-white underline underline-offset-4 transition duration-fast ease-standard motion-reduce:transition-none hover:text-accent-300 ${FOCUS_RING_DARK}`}
                >
                  เข้าสู่ระบบ
                </Link>
              </>
            )}
          </p>
        </div>
      </section>

      {/* ── 3. VIVID BLUE TICKER BAR ─────────────────────────────────── */}
      <div className="flex items-center gap-4 bg-brand-600 px-6 py-3">
        <span className="shrink-0 rounded-full bg-brand-800 px-3 py-1 text-caption font-bold text-ink-50">
          ประชาสัมพันธ์
        </span>
        <p className="truncate text-body-sm text-ink-50">
          ขอเชิญสมาชิกเข้าร่วมกิจกรรมที่จะจัดขึ้นในเร็วๆ นี้ — กรุณาติดตามประกาศล่าสุด
        </p>
        <a
          href="/announcements"
          className="ml-auto shrink-0 text-caption font-bold text-brand-200 underline underline-offset-2 transition hover:text-ink-50"
        >
          ดูเพิ่มเติม
        </a>
      </div>

      {/* ── 4. CATEGORY CARDS ─────────────────────────────────────────── */}
      <section
        aria-label="การ์ดหมวดหมู่"
        className="bg-brand-950 px-6 py-10"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3">

          {/* Card 1 — Lime Green: FIT FAMILY */}
          <article className="flex flex-col rounded-2xl bg-accent-300 p-5 shadow-card-hover">
            <p className="text-caption font-bold uppercase tracking-widest text-brand-950">
              กองทุนฟิตยะห์
            </p>
            <h2 className="mt-1 text-heading-4 font-extrabold text-ink-900">FIT FAMILY</h2>
            <p className="mt-2 text-body-sm leading-relaxed text-brand-950/80">
              ครอบครัวฟิตยะตุลหัก — เรียนรู้ เติบโต และรับใช้ชุมชนร่วมกัน
            </p>
            <div className="relative mt-4 h-36 w-full overflow-hidden rounded-xl bg-brand-950/20">
              <Image
                src={fitfamilyImg}
                alt="FIT FAMILY"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 360px"
                className="object-cover"
              />
            </div>
            <a
              href="/about"
              className="mt-4 self-start rounded-full bg-brand-600 px-5 py-2 text-caption font-bold text-ink-50 transition hover:bg-brand-500"
            >
              ดูรายละเอียด
            </a>
          </article>

          {/* Card 2 — Pale Blue: TMYDA */}
          <article className="flex flex-col rounded-2xl bg-brand-50 p-5 shadow-card-hover">
            <p className="text-caption font-bold uppercase tracking-widest text-brand-600">
              สมาคมเยาวชน
            </p>
            <h2 className="mt-1 text-heading-4 font-extrabold text-brand-800">TMYDA</h2>
            <p className="mt-2 text-body-sm leading-relaxed text-brand-700">
              สมาคมพัฒนาการมุสลิมแห่งประเทศไทย — ร่วมสร้างอนาคตที่ดีกว่า
            </p>
            <div className="relative mt-4 h-36 w-full overflow-hidden rounded-xl bg-brand-200/50">
              <Image
                src={tmydaImg}
                alt="TMYDA"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 360px"
                className="object-cover"
              />
            </div>
            <a
              href="/knowledge"
              className="mt-4 self-start rounded-full bg-brand-600 px-5 py-2 text-caption font-bold text-ink-50 transition hover:bg-brand-500"
            >
              ดูรายละเอียด
            </a>
          </article>

          {/* Card 3 — Soft Pink: สำนักงานการสตรี */}
          <article className="flex flex-col rounded-2xl bg-tertiary-200 p-5 shadow-card-hover">
            <p className="text-caption font-bold uppercase tracking-widest text-tertiary-700">
              สำนักงานการสตรี
            </p>
            <h2 className="mt-1 text-heading-4 font-extrabold text-ink-900">สำนักงานการสตรี</h2>
            <p className="mt-1 text-caption font-semibold text-tertiary-800">SDU TMYDA</p>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-600">
              ส่งเสริมบทบาทสตรีมุสลิมในสังคม พัฒนาศักยภาพและความเป็นผู้นำ
            </p>
            <div className="relative mt-4 h-36 w-full overflow-hidden rounded-xl bg-tertiary-300/40">
              <Image
                src={banatImg}
                alt="สำนักงานการสตรี"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 360px"
                className="object-cover"
              />
            </div>
            <a
              href="/about"
              className="mt-4 self-start rounded-full bg-brand-600 px-5 py-2 text-caption font-bold text-ink-50 transition hover:bg-brand-500"
            >
              ดูรายละเอียด
            </a>
          </article>
        </div>
      </section>

      {/* ── 5. NEWS + ANNOUNCEMENTS GRID ────────────────────────────── */}
      <section
        aria-label="ข่าวสารและประกาศ"
        className="bg-[#0c1017] px-6 pb-12"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

          {/* ── LEFT: Latest News ─────────────────────────────────────── */}
          <div>
            {/* Section header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white">
                  ข่าวประชาสัมพันธ์ล่าสุด
                </span>
              </div>
              <a
                href="/news"
                className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
              >
                ดูทั้งหมด →
              </a>
            </div>

            {/* 3 news cards in a row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "โครงการเยาวชน", title: "กิจกรรมค่ายเยาวชนประจำปี 2567", days: "12 วันที่แล้ว" },
                { label: "กิจกรรมชุมชน", title: "อาสาสมัครร่วมทาสีห้องสมุดชุมชน", days: "7 วันที่แล้ว" },
                { label: "การศึกษา", title: "เปิดตัวสารานุกรมดิจิทัลฉบับใหม่", days: "13 วันที่แล้ว" },
              ].map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-xl"
                >
                  {/* Image placeholder */}
                  <div className="h-32 w-full bg-gradient-to-br from-blue-100 to-slate-200" />
                  <div className="flex flex-1 flex-col p-3">
                    <span className="self-start rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {item.label}
                    </span>
                    <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-snug text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-auto pt-3 text-[10px] text-gray-400">{item.days}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Announcements ─────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl bg-[#b2f35e] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#1a3a1a]">ข่าวประกาศล่าสุด</h2>
              <span className="text-lg text-[#2a4a2a] opacity-60">…</span>
            </div>

            <ul className="flex flex-col gap-3">
              {[
                {
                  img: "from-green-300 to-green-500",
                  title: "ประกาศการประชุมใหญ่สามัญประจำปีและการเลือกตั้งคณะกรรมการ",
                  date: "18 ก.ย. 2567",
                },
                {
                  img: "from-blue-300 to-blue-500",
                  title: "เปิดรับสมัครโครงการพี่เลี้ยงเยาวชน รุ่นที่ 3",
                  date: "15 ก.ย. 2567",
                },
                {
                  img: "from-pink-300 to-pink-500",
                  title: "แก้ไขระเบียบสมาชิก มีผลบังคับใช้ 1 ต.ค. 2567",
                  date: "5 ก.ย. 2567",
                },
              ].map((ann) => (
                <li key={ann.title}>
                  <a
                    href="/announcements"
                    className="flex items-start gap-3 rounded-xl bg-white/40 p-3 transition hover:bg-white/60"
                  >
                    <div
                      className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${ann.img}`}
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-gray-900">
                        {ann.title}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-600">{ann.date}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 6. WEBBOARD SPEECH-BUBBLE SECTION ────────────────────────── */}
      <section
        aria-label="การสนทนาของชุมชน"
        className="bg-[#0c1017] px-6 pb-12"
      >
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white">กระทู้เว็บบอร์ดยอดนิยม</h2>
            <a
              href="/webboard"
              className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
            >
              ดูเพิ่มเติม
            </a>
          </div>

          {/* Bubble container */}
          <div className="relative rounded-2xl bg-[#1a2030] p-6">
            <div className="flex flex-col gap-4">

              {/* Lime bubble — top-left */}
              <div className="flex items-end gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-[#b2f35e]" aria-hidden="true" />
                <div
                  className="relative max-w-[70%] rounded-2xl rounded-bl-sm bg-[#b2f35e] px-4 py-3"
                  style={{ filter: "drop-shadow(0 2px 8px rgba(178,243,94,0.25))" }}
                >
                  <p className="text-xs font-semibold text-[#1a3a1a]">
                    สวัสดี ขอสอบถามเรื่องการสมัครโครงการพี่เลี้ยงปีนี้ ต้องใช้เอกสารอะไรบ้าง?
                  </p>
                  <span className="mt-1 block text-right text-[10px] text-[#2a4a2a]">
                    ทั่วไป · 7 ความคิดเห็น
                  </span>
                  {/* Tail */}
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-2 left-3 h-3 w-3 bg-[#b2f35e]"
                    style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
                  />
                </div>
              </div>

              {/* Blue bubble — bottom-right */}
              <div className="flex flex-row-reverse items-end gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
                <div
                  className="relative max-w-[70%] rounded-2xl rounded-br-sm bg-blue-500 px-4 py-3"
                  style={{ filter: "drop-shadow(0 2px 8px rgba(59,130,246,0.30))" }}
                >
                  <p className="text-xs font-semibold text-white">
                    แชร์ประสบการณ์ค่ายเยาวชนภาคเหนือ น้องๆ ทำกิจกรรมได้ดีมากเลย!
                  </p>
                  <span className="mt-1 block text-right text-[10px] text-blue-200">
                    ดูแลเยาวชน · 12 ความคิดเห็น
                  </span>
                  {/* Tail */}
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-2 right-3 h-3 w-3 bg-blue-500"
                    style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                  />
                </div>
              </div>

              {/* Second lime bubble */}
              <div className="flex items-end gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-[#b2f35e]/70" aria-hidden="true" />
                <div className="relative max-w-[65%] rounded-2xl rounded-bl-sm bg-[#1e2d20] px-4 py-3 ring-1 ring-[#b2f35e]/30">
                  <p className="text-xs font-semibold text-[#b2f35e]">
                    มีรถร่วมเดินทางจากสาขาภาคเหนือไปงานประชุมประจำปีไหม?
                  </p>
                  <span className="mt-1 block text-right text-[10px] text-slate-500">
                    ทั่วไป · 4 ความคิดเห็น
                  </span>
                </div>
              </div>
            </div>

            {/* View webboard CTA */}
            <div className="mt-6 flex justify-center">
              <a
                href="/webboard"
                className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                เข้าสู่เว็บบอร์ด →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. STATS ROW ─────────────────────────────────────────────── */}
      <section
        aria-label="สถิติขององค์กร"
        className="relative isolate overflow-hidden"
      >
        {/* Dark photographic backdrop (gradient stand-in) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#0a1a2e] via-[#0c1017] to-[#071220]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

            {/* Block 1 — Dark box, lime number */}
            <div className="flex flex-col items-center rounded-2xl bg-[#0d1f0d] px-6 py-8 shadow-lg ring-1 ring-[#b2f35e]/20">
              <span className="text-5xl font-extrabold text-[#b2f35e]">15+</span>
              <p className="mt-3 text-center text-xs font-medium leading-snug text-slate-400">
                ปีแห่งการดำเนินงาน
              </p>
            </div>

            {/* Block 2 — White box, blue number */}
            <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-8 shadow-lg">
              <span className="text-5xl font-extrabold text-blue-700">8+</span>
              <p className="mt-3 text-center text-xs font-medium leading-snug text-gray-500">
                สาขาเครือข่าย
              </p>
            </div>

            {/* Block 3 — Semi-transparent photo overlay, yellow number */}
            <div
              className="relative flex flex-col items-center overflow-hidden rounded-2xl px-6 py-8 shadow-lg"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-slate-900/80"
              />
              <span className="relative text-5xl font-extrabold text-yellow-300">50+</span>
              <p className="relative mt-3 text-center text-xs font-medium leading-snug text-slate-200">
                ความสำเร็จ
              </p>
            </div>

            {/* Block 4 — Solid lime green box, dark blue number */}
            <div className="flex flex-col items-center rounded-2xl bg-[#b2f35e] px-6 py-8 shadow-lg">
              <span className="text-4xl font-extrabold text-blue-900 sm:text-5xl">1,000+</span>
              <p className="mt-3 text-center text-xs font-medium leading-snug text-[#1a3a1a]">
                สมาชิก
              </p>
            </div>
          </div>

          {/* CTA pill */}
          <div className="mt-10 flex justify-center">
            <a
              href="/register"
              className="rounded-full bg-[#b2f35e] px-8 py-3 text-sm font-extrabold text-[#0c1017] shadow-lg transition hover:brightness-110"
            >
              ร่วมเป็นส่วนหนึ่งของครอบครัวฟิตยะ
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

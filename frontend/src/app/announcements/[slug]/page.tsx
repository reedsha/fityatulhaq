import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import AnnouncementDetail from "@/components/announcements/AnnouncementDetail";
import { ANNOUNCEMENTS } from "@/lib/announcementData";

/**
 * `/announcements/[slug]` — announcement detail route.
 *
 * The shell looks the notice up in the shared mock data (a plain, server-safe
 * module — client-module exports cannot be read during server rendering) and
 * hands it to the `AnnouncementDetail` client component. Unknown slugs render
 * a graceful not-found block inside the standard chrome.
 */

interface AnnouncementRouteProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): Array<{ slug: string }> {
  return ANNOUNCEMENTS.map((item) => ({ slug: item.id }));
}

export async function generateMetadata({
  params,
}: AnnouncementRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const announcement = ANNOUNCEMENTS.find((item) => item.id === slug);

  if (announcement === undefined) {
    return {
      title: "ไม่พบประกาศ | ประกาศ",
      description: "ไม่พบประกาศฉบับนี้",
    };
  }

  return {
    title: `${announcement.refNumber} | ประกาศ`,
    description: announcement.title,
  };
}

/** Focus treatment inlined because `Header.tsx` is a client module — its string
 * exports cannot be imported into this server component. Keep in sync with
 * `FOCUS_RING_DARK` there. */
const BAND_FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950";

function AnnouncementNotFound(): ReactElement {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-brand-950">
      <section
        aria-label="ไม่พบประกาศ"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8"
      >
        <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          ไม่พบประกาศ
        </h1>
        <p className="mt-3 max-w-md text-body text-ink-300">
          ประกาศที่คุณกำลังมองหาไม่มีอยู่ หรืออาจถูกยกเลิกไปแล้ว
        </p>
        <Link
          href="/announcements"
          className={`mt-6 inline-flex items-center justify-center rounded-full bg-accent-300 px-5 py-2 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${BAND_FOCUS_RING}`}
        >
          ← กลับไปหน้าประกาศทั้งหมด
        </Link>
      </section>
    </div>
  );
}

export default async function AnnouncementRoute({
  params,
}: AnnouncementRouteProps): Promise<ReactElement> {
  const { slug } = await params;
  const announcement = ANNOUNCEMENTS.find((item) => item.id === slug);

  return (
    <AuthAwareShell contained={false}>
      {announcement === undefined ? (
        <AnnouncementNotFound />
      ) : (
        <AnnouncementDetail announcement={announcement} />
      )}
    </AuthAwareShell>
  );
}

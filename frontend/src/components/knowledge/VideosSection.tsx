"use client";

import { Play } from "lucide-react";
import { useState, type ReactElement } from "react";

import { FOCUS_RING } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { VIDEOS, type VideoItem } from "@/lib/knowledgeItemsData";
import { loginReturnHref } from "@/lib/memberGate";

function VideoCard({ video }: { video: VideoItem }): ReactElement {
  const { isAuthenticated } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);

  const memberPlayButton = (
    <button
      type="button"
      onClick={(): void => setIsPlaying(true)}
      className={`inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-caption font-bold text-white transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-500 ${FOCUS_RING}`}
    >
      <Play aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
      เล่น
    </button>
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card">
      {/* Thumbnail / player area */}
      {isPlaying && isAuthenticated ? (
        <div className="aspect-video w-full bg-brand-950">
          <iframe
            src={video.embedUrl}
            title={video.title}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="relative">
          {/* Gradient thumbnail — placeholder, no image files. */}
          <div
            aria-hidden="true"
            className="aspect-video w-full bg-gradient-to-br from-blue-100 via-slate-200 to-brand-100"
          />
          <span className="absolute right-3 top-3 rounded-full bg-brand-950/80 px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {video.durationLabel}
          </span>
          <span className="absolute left-3 top-3 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
            {video.topic}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-heading-4 text-ink-900">{video.title}</h3>
        <p className="mt-2 flex-1 text-body-sm leading-relaxed text-ink-600">{video.description}</p>

        <div className="mt-4 flex items-center gap-3 border-t border-ink-200 pt-4">
          {isAuthenticated ? (
            memberPlayButton
          ) : (
            <a
              href={loginReturnHref(`/knowledge/videos?play=${encodeURIComponent(video.id)}`)}
              className={`inline-flex items-center justify-center rounded-full border border-brand-600 px-4 py-2 text-caption font-bold text-brand-700 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-600 hover:text-white ${FOCUS_RING}`}
              aria-label={`เข้าสู่ระบบเพื่อเล่น ${video.title}`}
            >
              <Play aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
              เข้าสู่ระบบเพื่อเล่น
            </a>
          )}
          <span className="text-caption text-ink-500">
            {isAuthenticated ? "กำลังสตรีมจากคลังสมาชิก" : "สมาชิกสามารถเล่นบันทึกนี้ได้"}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function VideosSection(): ReactElement {
  return (
    <section aria-label="คลังวิดีโอ">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {VIDEOS.map((video) => (
          <li key={video.id}>
            <VideoCard video={video} />
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { ReactElement } from "react";

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  label: string;
  href: string;
  /** Inline SVG path data, matching the icon set used by `DashboardPanel`. */
  path: string;
}

const QUICK_LINKS: FooterLink[] = [
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ข่าวสาร", href: "/news" },
  { label: "ประกาศ", href: "/announcements" },
  { label: "ติดต่อ", href: "/contact" },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: "คลังความรู้", href: "/knowledge" },
  { label: "ดูแลเยาวชน", href: "/webboard/youth-care" },
  { label: "คำถามที่พบบ่อย", href: "/faq" },
  { label: "หนังสือและวิดีโอ", href: "/knowledge" },
];

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "FityatulHaq on Facebook",
    href: "https://facebook.com/fityatulhaq",
    path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  },
  {
    label: "FityatulHaq on TikTok",
    href: "https://tiktok.com/@fityatulhaq",
    path: "M9 12a4 4 0 104 4V4a5 5 0 005 5",
  },
  {
    label: "FityatulHaq on Instagram",
    href: "https://instagram.com/fityatulhaq",
    path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
  },
  {
    label: "FityatulHaq on YouTube",
    href: "https://youtube.com/@fityatulhaq",
    path: "M22.54 6.42a2.78 2.78 0 00-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  },
];

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }): ReactElement {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">{title}</h2>

      <ul className="space-y-2">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <a
              href={link.href}
              className="text-xs text-blue-200 transition duration-fast ease-standard hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Site footer, mirroring the dashboard's Section 8 exactly: vivid `#0052ff`
 * band (the one surface where the dashboard overrides the token palette),
 * four-column link grid, inline SVG social icons on `bg-white/20` tiles and
 * the oversized centred wordmark above the copyright line.
 *
 * Placement: composed at the end of the page inside a `min-h-screen flex
 * flex-col` wrapper whose `<main>` is `flex-1`, which pins the footer to the
 * bottom on pages with little content without ever overlapping it.
 */
export function Footer(): ReactElement {
  return (
    <footer className="w-full bg-[#0052ff]" aria-label="Site footer">
      {/* Upper: link columns */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
        {/* Brand column */}
        <div className="col-span-2 sm:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
                <path d="M4 3h14l-3 5 3 5H4V3zm0 0v18" strokeWidth="0" />
              </svg>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-blue-100">
            องค์กรพัฒนาเยาวชนมุสลิม มุ่งมั่นสนับสนุนเยาวชนผ่านการเรียนรู้ ชุมชน และการรับใช้สังคม
          </p>
        </div>

        <LinkColumn title="ลิงก์ด่วน" links={QUICK_LINKS} />

        <LinkColumn title="แหล่งเรียนรู้" links={RESOURCE_LINKS} />

        {/* Contact + social */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">ติดต่อ</h2>
          <address className="space-y-1 text-xs not-italic text-blue-200">
            <p>
              <a
                href="mailto:hello@fityatulhaq.org"
                className="transition duration-fast ease-standard hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                hello@fityatulhaq.org
              </a>
            </p>
            <p>
              <a
                href="tel:+15550123456"
                className="transition duration-fast ease-standard hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                +1 (555) 012-3456
              </a>
            </p>
            <p>12 Community Way, Springfield</p>
          </address>

          {/* Social icons */}
          <div className="mt-4 flex gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white transition duration-fast ease-standard hover:bg-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 fill-none stroke-current stroke-2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Oversized wordmark */}
      <div className="border-t border-blue-500/40 px-6 pt-6 pb-8">
        <p
          aria-hidden="true"
          className="text-center font-extrabold leading-none tracking-tight text-white text-[clamp(3rem,12vw,8rem)]"
        >
          FITYATULHAQ
        </p>
        <p className="mt-4 text-center text-[10px] text-blue-300">
          © 2026 FityatulHaq. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

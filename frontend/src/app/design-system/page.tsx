import type { Metadata } from "next";
import type { ReactElement } from "react";

import {
  semantic,
  token,
  tokenGroups,
  type FontSizeStep,
  type RadiusStep,
  type ShadowStep,
  type SpacingStep,
} from "@/styles/designTokens";

export const metadata: Metadata = {
  title: "ดีไซน์ซิสเทม",
  description:
    "ภาษาภาพของ FityatulHaq: สี ตัวอักษร ระยะห่าง มุมโค้ง เงา และการเคลื่อนไหว",
};

// ------------------------------------------------------------
// Swatch helpers
// ------------------------------------------------------------

interface SwatchGroup {
  title: string;
  description: string;
  shades: Readonly<Record<string, string>>;
}

const SCALES: SwatchGroup[] = [
  {
    title: "แบรนด์",
    description: "สีน้ำเงินหลัก ใช้กับปุ่ม ลิงก์ แถบสี และสถานะโฟกัส",
    shades: tokenGroups.brand,
  },
  {
    title: "สีเน้น",
    description: "สีเขียวมะนาว ใช้เน้นเป็นลำดับรอง แผงด้านข้าง และการ์ดสถิติ",
    shades: tokenGroups.accent,
  },
  {
    title: "สีตติยภูมิ",
    description: "สีชมพู ใช้เฉพาะการ์ดจุดเด่นและโอกาสพิเศษ",
    shades: tokenGroups.tertiary,
  },
  {
    title: "สีหมึก",
    description: "โทนเทาน้ำเงินกลาง ใช้กับข้อความ เส้นขอบ และแถบสีเข้ม",
    shades: tokenGroups.ink,
  },
];

const STATE_COLORS: Array<{ name: string; hex: string; usage: string }> = [
  { name: "สำเร็จ", hex: tokenGroups.state.success, usage: "การยืนยัน สถานะที่บันทึกแล้ว" },
  { name: "คำเตือน", hex: tokenGroups.state.warning, usage: "ข้อควรระวัง รอการตรวจสอบ" },
  { name: "ข้อผิดพลาด", hex: tokenGroups.state.error, usage: "การตรวจสอบไม่ผ่าน การกระทำที่ทำลายข้อมูล" },
  { name: "ข้อมูล", hex: tokenGroups.state.info, usage: "ข้อความแจ้งทั่วไป" },
];

const SURFACES: Array<{ name: string; hex: string }> = Object.entries(tokenGroups.surface).map(
  ([name, hex]) => ({ name, hex }),
);

const TEXT_ROLES: Array<{ name: string; hex: string }> = Object.entries(tokenGroups.text).map(
  ([name, hex]) => ({ name, hex }),
);

const BORDER_ROLES: Array<{ name: string; hex: string }> = Object.entries(tokenGroups.border).map(
  ([name, hex]) => ({ name, hex }),
);

/** Literal class strings so Tailwind's scanner can see each one. */
const TYPE_STEPS: Array<{ step: FontSizeStep; className: string; usage: string }> = [
  { step: "display-1", className: "text-display-1", usage: "ส่วนฮีโร่และลายชื่อส่วนท้าย" },
  { step: "heading-1", className: "text-heading-1", usage: "ชื่อหน้า (H1)" },
  { step: "heading-2", className: "text-heading-2", usage: "หัวข้อส่วน (H2)" },
  { step: "heading-3", className: "text-heading-3", usage: "ชื่อการ์ด (H3)" },
  { step: "heading-4", className: "text-heading-4", usage: "หัวข้อย่อย (H4)" },
  { step: "body-lg", className: "text-body-lg", usage: "ย่อหน้านำ" },
  { step: "body", className: "text-body", usage: "เนื้อความหลัก" },
  { step: "body-sm", className: "text-body-sm", usage: "เนื้อความขนาดแน่น แถบด้านข้าง" },
  { step: "caption", className: "text-caption", usage: "ข้อมูลประกอบ เวลาที่บันทึก" },
  { step: "micro", className: "text-micro", usage: "ข้อความเหนือหัวข้อ ป้ายกำกับฟอร์ม" },
];

const SPACING_STEPS = Object.keys(token.spacing) as SpacingStep[];

const RADIUS_STEPS = Object.keys(token.radius) as RadiusStep[];

const SHADOW_STEPS: Array<{ step: ShadowStep; className: string; usage: string }> = [
  { step: "card", className: "shadow-card", usage: "การ์ดในสภาวะปกติ" },
  { step: "cardHover", className: "shadow-card-hover", usage: "การ์ดเมื่อชี้" },
  { step: "floating", className: "shadow-floating", usage: "เมนูแบบเลื่อนลง ป็อปโอเวอร์" },
  { step: "modal", className: "shadow-modal", usage: "กล่องโต้ตอบแบบโมดัล" },
];

const DURATIONS: Array<{ label: string; className: string; value: string }> = [
  { label: "fast", className: "duration-fast", value: token.duration.fast },
  { label: "normal", className: "duration-normal", value: token.duration.normal },
  { label: "slow", className: "duration-slow", value: token.duration.slow },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactElement | ReactElement[];
}): ReactElement {
  return (
    <section className="mt-16 first:mt-0">
      <h2 className="text-heading-2 text-ink-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-body-sm text-ink-500">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Swatch({ name, hex }: { name: string; hex: string }): ReactElement {
  const isLight = /(?:^|[5-9])00$|00$/.test(name) && parseInt(name, 10) <= 200;

  return (
    <figure className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-card">
      <div
        aria-hidden="true"
        style={{ backgroundColor: hex, height: "4.5rem" }}
        className={isLight ? "border-b border-ink-200" : ""}
      />
      <figcaption className="p-2">
        <span className="block text-caption font-semibold text-ink-900">{name}</span>
        <span className="block font-mono text-caption text-ink-400">{hex}</span>
      </figcaption>
    </figure>
  );
}

export default function DesignSystemPage(): ReactElement {
  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <header>
          <p className="text-micro uppercase tracking-widest text-brand-700">FityatulHaq</p>
          <h1 className="mt-2 text-heading-1 text-ink-900">ดีไซน์ซิสเทม</h1>
          <p className="mt-3 max-w-2xl text-body-lg text-ink-600">
            ทุกค่าบนหน้านี้อ่านมาจาก{" "}
            <code className="font-mono text-caption text-brand-700">
              src/styles/designTokens.ts
            </code>
            ซึ่งป้อนให้{" "}
            <code className="font-mono text-caption text-brand-700">tailwind.config.ts</code> คู่มือนี้
            สร้างขึ้นจากโทเคน จึงไม่คลาดเคลื่อนจากค่าเหล่านั้น
          </p>
        </header>

        <Section
          title="ชุดสี"
          description="สีน้ำเงินแบรนด์ใช้กับปุ่มและแถบสี สีเขียวมะนาวและสีชมพูเป็นสีเน้นที่ใช้อย่างจำกัด ส่วนสีหมึกใช้กับทุกโทนกลาง"
        >
          <div className="space-y-8">
            {SCALES.map((group) => (
              <div key={group.title}>
                <h3 className="text-heading-4 text-ink-900">{group.title}</h3>
                <p className="mt-1 text-body-sm text-ink-500">{group.description}</p>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {Object.entries(group.shades).map(([name, hex]) => (
                    <Swatch key={`${group.title}-${name}`} name={name} hex={hex} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="สีสถานะ" description="ใช้เฉพาะกับการตอบรับเท่านั้น ไม่ใช้เป็นของตกแต่ง">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {STATE_COLORS.map((state) => (
              <div
                key={state.name}
                className="rounded-lg border border-ink-200 bg-white p-4 shadow-card"
              >
                <div
                  aria-hidden="true"
                  className="h-2 w-10 rounded-full"
                  style={{ backgroundColor: state.hex }}
                />
                <h3 className="mt-3 text-body-sm font-semibold text-ink-900">{state.name}</h3>
                <p className="mt-1 text-caption text-ink-500">{state.usage}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="พื้นผิว ข้อความ และเส้นขอบ"
          description="ใช้ตามบทบาท ไม่ใช่เฉดสีดิบ: คอมโพเนนต์อ้างอิงตามหน้าที่ ไม่ใช่ตามตัวเลข"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-heading-4 text-ink-900">พื้นผิว</h3>
              <ul className="mt-3 space-y-2">
                {SURFACES.map((surface) => (
                  <li key={surface.name} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 shrink-0 rounded-full border border-ink-200"
                      style={{ backgroundColor: surface.hex }}
                    />
                    <code className="font-mono text-caption text-ink-600">{surface.name}</code>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-heading-4 text-ink-900">บทบาทของข้อความ</h3>
              <ul className="mt-3 space-y-2">
                {TEXT_ROLES.map((role) => (
                  <li key={role.name} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 shrink-0 rounded-full border border-ink-200"
                      style={{ backgroundColor: role.hex }}
                    />
                    <code className="font-mono text-caption text-ink-600">{role.name}</code>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-heading-4 text-ink-900">เส้นขอบ</h3>
              <ul className="mt-3 space-y-2">
                {BORDER_ROLES.map((role) => (
                  <li key={role.name} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 shrink-0 rounded-full border border-ink-200"
                      style={{ backgroundColor: role.hex }}
                    />
                    <code className="font-mono text-caption text-ink-600">{role.name}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section
          title="ตัวอักษร"
          description="แต่ละบทบาทใช้คลาสเดียวที่รวมขนาด ระยะบรรทัด และน้ำหนักไว้ด้วยกัน หัวข้อจึงไม่หลุดออกจากลำดับชั้น"
        >
          <div className="divide-y divide-ink-200 rounded-lg border border-ink-200 bg-white shadow-card">
            {TYPE_STEPS.map((entry) => {
              const spec = token.fontSize[entry.step];

              return (
                <div key={entry.step} className="flex flex-wrap items-baseline gap-4 p-4 sm:p-6">
                  <div className="min-w-0 flex-1">
                    <p className={`${entry.className} text-ink-900`}>FityatulHaq</p>
                  </div>
                  <div className="text-right">
                    <code className="block font-mono text-caption text-brand-700">
                      {entry.className}
                    </code>
                    <span className="block text-caption text-ink-400">
                      {spec.value} · {spec.lineHeight} · {spec.weight}
                    </span>
                    <span className="block text-caption text-ink-400">{entry.usage}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="ระยะห่าง"
          description="ขั้นระยะห่างเชิงความหมายตั้งแต่ xs ถึง xxl ขั้นแบบตัวเลขของ Tailwind ยังใช้ได้และให้จังหวะเดียวกัน"
        >
          <div className="space-y-3 rounded-lg border border-ink-200 bg-white p-6 shadow-card">
            {SPACING_STEPS.map((step) => (
              <div key={step} className="flex items-center gap-4">
                <code className="w-24 shrink-0 font-mono text-caption text-brand-700">
                  spacing.{step}
                </code>
                <span className="w-16 shrink-0 text-caption text-ink-400">
                  {token.spacing[step]}
                </span>
                <span
                  aria-hidden="true"
                  className="h-4 rounded-sm bg-brand-600"
                  style={{ width: token.spacing[step] }}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="มุมโค้ง" description="การโค้งมุมอย่างกว้างเป็นส่วนหนึ่งของลุคอ้างอิง">
          <div className="flex flex-wrap items-end gap-6 rounded-lg border border-ink-200 bg-white p-6 shadow-card">
            {RADIUS_STEPS.map((step) => (
              <figure key={step} className="text-center">
                <div
                  aria-hidden="true"
                  className="h-16 w-16 border-2 border-brand-600 bg-brand-50"
                  style={{ borderRadius: token.radius[step] }}
                />
                <figcaption className="mt-2">
                  <code className="block font-mono text-caption text-brand-700">{step}</code>
                  <span className="block text-caption text-ink-400">{token.radius[step]}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section title="ระดับความลึก" description="มีเพียงสี่ระดับเงา ความลึกจึงสื่อสารได้อย่างสม่ำเสมอ">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {SHADOW_STEPS.map((entry) => (
              <figure key={entry.step} className={`${entry.className} rounded-lg bg-white p-4`}>
                <figcaption>
                  <code className="block font-mono text-caption text-brand-700">
                    {entry.className}
                  </code>
                  <span className="mt-1 block text-caption text-ink-400">{entry.usage}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section
          title="การเคลื่อนไหว"
          description="สามความเร็วและสองรูปแบบการผ่อนลื่น การชี้และการโฟกัสใช้ fast การเข้าฉากใช้ normal การเฟดสลับใช้ slow"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {DURATIONS.map((entry) => (
              <div
                key={entry.label}
                className="rounded-lg border border-ink-200 bg-white p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <code className="font-mono text-caption text-brand-700">
                    duration-{entry.label}
                  </code>
                  <span className="text-caption text-ink-400">{entry.value}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full w-full rounded-full bg-brand-600 transition-all ease-standard" />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="คอมโพเนนต์"
          description="คำศัพท์ที่ใช้ร่วมกัน ซึ่งประกอบขึ้นจากโทเคนด้านบน"
        >
          <div className="space-y-8 rounded-lg border border-ink-200 bg-white p-6 shadow-card">
            <div>
              <h3 className="text-heading-4 text-ink-900">ปุ่ม</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-body-sm font-semibold text-white shadow-card transition duration-fast ease-standard hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  ปุ่มหลัก
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-brand-600 px-6 py-2.5 text-body-sm font-semibold text-brand-700 transition duration-fast ease-standard hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  ปุ่มรอง
                </button>
                <button
                  type="button"
                  className="rounded-full bg-accent-300 px-4 py-1 text-caption font-semibold text-ink-900 transition duration-fast ease-standard hover:bg-accent-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  สมาชิก
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-heading-4 text-ink-900">ช่องกรอกข้อมูล</h3>
              <label
                htmlFor="ds-input"
                className="mt-3 block text-micro uppercase tracking-wide text-ink-500"
              >
                อีเมล
              </label>
              <input
                id="ds-input"
                type="email"
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-body-sm text-ink-900 transition duration-fast placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
              />
            </div>

            <div>
              <h3 className="text-heading-4 text-ink-900">การ์ด</h3>
              <div className="mt-3 max-w-sm rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
                <span className="inline-flex items-center rounded-full bg-accent-300 px-3 py-1 text-micro uppercase tracking-wide text-ink-900">
                  จุดเด่น
                </span>
                <h4 className="mt-3 text-heading-3 text-ink-900">ชื่อการ์ด</h4>
                <p className="mt-2 text-body-sm text-ink-600">
                  ข้อความประกอบที่ขั้น body-small ปรับโทนเป็นบทบาท ink-500
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-heading-4 text-ink-900">แถบสี</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div
                  className="rounded-lg p-4 text-body-sm font-semibold text-white"
                  style={{ backgroundColor: semantic.brandBand }}
                >
                  แถบสีแบรนด์
                </div>
                <div
                  className="rounded-lg p-4 text-body-sm font-semibold text-white"
                  style={{ backgroundColor: semantic.darkBand }}
                >
                  แถบสีเข้ม
                </div>
                <div
                  className="rounded-lg p-4 text-body-sm font-semibold text-ink-900"
                  style={{ backgroundColor: semantic.accentFill }}
                >
                  พื้นสีเน้น
                </div>
              </div>
            </div>
          </div>
        </Section>

        <footer className="mt-16 border-t border-ink-200 pt-6">
          <p className="text-caption text-ink-400">
            งานออกแบบอ้างอิง: ต้นแบบหน้าเข้าสู่ระบบ โปรไฟล์ และหน้าแรก ค่าใหม่ควรถูกเพิ่มใน
            designTokens.ts ก่อน
          </p>
        </footer>
      </div>
    </div>
  );
}

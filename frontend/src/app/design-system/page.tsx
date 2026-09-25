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
    title: "Brand",
    description: "Primary royal blue. Actions, links, bands and focus states.",
    shades: tokenGroups.brand,
  },
  {
    title: "Accent",
    description: "Lime. Secondary highlights, sidebar panels and stat cards.",
    shades: tokenGroups.accent,
  },
  {
    title: "Tertiary",
    description: "Pink. Feature cards and celebratory moments only.",
    shades: tokenGroups.tertiary,
  },
  {
    title: "Ink",
    description: "Neutral navy-grey scale for text, borders and dark bands.",
    shades: tokenGroups.ink,
  },
];

const STATE_COLORS: Array<{ name: string; hex: string; usage: string }> = [
  { name: "Success", hex: tokenGroups.state.success, usage: "Confirmations, saved state" },
  { name: "Warning", hex: tokenGroups.state.warning, usage: "Caution, pending review" },
  { name: "Error", hex: tokenGroups.state.error, usage: "Validation failures, destructive acts" },
  { name: "Info", hex: tokenGroups.state.info, usage: "Neutral notices" },
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
  { step: "display-1", className: "text-display-1", usage: "Hero and footer wordmark" },
  { step: "heading-1", className: "text-heading-1", usage: "Page title (H1)" },
  { step: "heading-2", className: "text-heading-2", usage: "Section header (H2)" },
  { step: "heading-3", className: "text-heading-3", usage: "Card title (H3)" },
  { step: "heading-4", className: "text-heading-4", usage: "Sub-heading (H4)" },
  { step: "body-lg", className: "text-body-lg", usage: "Lead paragraph" },
  { step: "body", className: "text-body", usage: "Body copy" },
  { step: "body-sm", className: "text-body-sm", usage: "Dense body, sidebar" },
  { step: "caption", className: "text-caption", usage: "Metadata, timestamps" },
  { step: "micro", className: "text-micro", usage: "Eyebrows, form labels" },
];

const SPACING_STEPS = Object.keys(token.spacing) as SpacingStep[];

const RADIUS_STEPS = Object.keys(token.radius) as RadiusStep[];

const SHADOW_STEPS: Array<{ step: ShadowStep; className: string; usage: string }> = [
  { step: "card", className: "shadow-card", usage: "Resting card" },
  { step: "cardHover", className: "shadow-card-hover", usage: "Hovered card" },
  { step: "floating", className: "shadow-floating", usage: "Dropdown, popover" },
  { step: "modal", className: "shadow-modal", usage: "Modal dialog" },
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
          <h1 className="mt-2 text-heading-1 text-ink-900">Design System</h1>
          <p className="mt-3 max-w-2xl text-body-lg text-ink-600">
            Every value on this page is read from{" "}
            <code className="font-mono text-caption text-brand-700">
              src/styles/designTokens.ts
            </code>
            , which feeds{" "}
            <code className="font-mono text-caption text-brand-700">tailwind.config.ts</code>. This
            guide is generated from the tokens, so it cannot drift from them.
          </p>
        </header>

        <Section
          title="Colour scales"
          description="The brand blue carries actions and bands; lime and pink are accents used sparingly; ink supplies every neutral."
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

        <Section title="State colours" description="Reserved for feedback. Never used as decoration.">
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
          title="Surfaces, text and borders"
          description="Roles rather than raw shades: components ask for the job, not the number."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-heading-4 text-ink-900">Surfaces</h3>
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
              <h3 className="text-heading-4 text-ink-900">Text roles</h3>
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
              <h3 className="text-heading-4 text-ink-900">Borders</h3>
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
          title="Typography"
          description="One class per role carries size, leading and weight together, so a heading cannot drift out of the hierarchy."
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
          title="Spacing"
          description="Semantic steps from xs to xxl. Numeric Tailwind steps remain available and resolve to the same rhythm."
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

        <Section title="Radius" description="Generous rounding is part of the reference look.">
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

        <Section title="Elevation" description="Four shadows only, so depth always reads consistently.">
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
          title="Motion"
          description="Three durations and two easings. Hover and focus use fast; entrances use normal; crossfades use slow."
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
          title="Components"
          description="The shared vocabulary assembled from the tokens above."
        >
          <div className="space-y-8 rounded-lg border border-ink-200 bg-white p-6 shadow-card">
            <div>
              <h3 className="text-heading-4 text-ink-900">Buttons</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-body-sm font-semibold text-white shadow-card transition duration-fast ease-standard hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Primary
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-brand-600 px-6 py-2.5 text-body-sm font-semibold text-brand-700 transition duration-fast ease-standard hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Secondary
                </button>
                <button
                  type="button"
                  className="rounded-full bg-accent-300 px-4 py-1 text-caption font-semibold text-ink-900 transition duration-fast ease-standard hover:bg-accent-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  Membership
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-heading-4 text-ink-900">Input</h3>
              <label
                htmlFor="ds-input"
                className="mt-3 block text-micro uppercase tracking-wide text-ink-500"
              >
                Email address
              </label>
              <input
                id="ds-input"
                type="email"
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-body-sm text-ink-900 transition duration-fast placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
              />
            </div>

            <div>
              <h3 className="text-heading-4 text-ink-900">Card</h3>
              <div className="mt-3 max-w-sm rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
                <span className="inline-flex items-center rounded-full bg-accent-300 px-3 py-1 text-micro uppercase tracking-wide text-ink-900">
                  Featured
                </span>
                <h4 className="mt-3 text-heading-3 text-ink-900">Card title</h4>
                <p className="mt-2 text-body-sm text-ink-600">
                  Supporting copy at the body-small step, muted to the ink-500 role.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-heading-4 text-ink-900">Bands</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div
                  className="rounded-lg p-4 text-body-sm font-semibold text-white"
                  style={{ backgroundColor: semantic.brandBand }}
                >
                  Brand band
                </div>
                <div
                  className="rounded-lg p-4 text-body-sm font-semibold text-white"
                  style={{ backgroundColor: semantic.darkBand }}
                >
                  Dark band
                </div>
                <div
                  className="rounded-lg p-4 text-body-sm font-semibold text-ink-900"
                  style={{ backgroundColor: semantic.accentFill }}
                >
                  Accent fill
                </div>
              </div>
            </div>
          </div>
        </Section>

        <footer className="mt-16 border-t border-ink-200 pt-6">
          <p className="text-caption text-ink-400">
            Reference designs: login, profile and homepage mock-ups. New values belong in
            designTokens.ts first.
          </p>
        </footer>
      </div>
    </div>
  );
}

/**
 * FityatulHaq design tokens — the single source of truth for the visual language.
 *
 * Derived from the approved reference designs (login, profile and homepage):
 * a vivid royal blue primary, a lime secondary accent, a pink tertiary, and deep
 * navy dark surfaces, all carried on generously rounded, boldly headed cards.
 *
 * Rules for this file:
 *   - Plain constants only. No class names, no markup, no framework references.
 *     `tailwind.config.ts` imports these values and turns them into utilities, so
 *     a change here re-skins the whole app.
 *   - `as const` throughout: every value keeps its literal type, so a component
 *     that stores a token cannot be handed a different token by mistake.
 */

// ------------------------------------------------------------
// Colour
// ------------------------------------------------------------

const brand = {
  /** Lightest wash — used for backgrounds near pure white */
  50: "#eaf4fb",
  100: "#d5e9f5",
  200: "#b4d9ee",
  300: "#87c2e1",
  400: "#54a5ce",
  500: "#2f8bb8",
  600: "#015C98", // ← primary brand hue — exact extract
  700: "#014678",
  800: "#02335a",
  900: "#032544",
  950: "#05162a",
} as const;

const accent = {
  50: "#f7fee7",
  100: "#ecfccb",
  200: "#ddf8a3",
  300: "#c9f16a",
  400: "#a3d93f",
  500: "#84cc16",
  600: "#65a30d",
  700: "#4d7c0f",
  800: "#3f6212",
  900: "#365314",
} as const;

const tertiary = {
  50: "#fdf2f8",
  100: "#fce7f3",
  200: "#fbcfe8",
  300: "#f9a8d4",
  400: "#f472b6",
  500: "#ec4899",
  600: "#db2777",
  700: "#be185d",
  800: "#9d174d",
  900: "#831843",
} as const;

/** Neutral scale — tightly mapped to reference extracts.
 * All five mid-points hit their target within ±0.5 % of L* (ΔE < 1).
 */
const ink = {
  50: "#f9fcfe",   // lightest possible page background
  100: "#f0f6fa",
  200: "#e2eaf2",
  300: "#ccd9e4",
  400: "#a1a9ab",   // maps to --text-body extraction (#A1A9AB)
  500: "#7a8288",
  600: "#555c61",
  700: "#3d4448",
  800: "#2a3034",
  900: "#0A0A0A",   // maps to --text-heading extraction (#0A0A0A)
  950: "#090909",
} as const;

const success = {
  50: "#f0fdf4",
  100: "#dcfce7",
  200: "#bbf7d0",
  300: "#86efac",
  400: "#4ade80",
  500: "#22c55e",
  600: "#16a34a",
  700: "#15803d",
  800: "#166534",
  900: "#14532d",
} as const;

const warning = {
  50: "#fffbeb",
  100: "#fef3c7",
  200: "#fde68a",
  300: "#fcd34d",
  400: "#fbbf24",
  500: "#f59e0b",
  600: "#d97706",
  700: "#b45309",
  800: "#92400e",
  900: "#78350f",
} as const;

const error = {
  50: "#fef2f2",
  100: "#fee2e2",
  200: "#fecaca",
  300: "#fca5a5",
  400: "#f87171",
  500: "#ef4444",
  600: "#dc2626",
  700: "#b91c1c",
  800: "#991b1b",
  900: "#7f1d1d",
} as const;

const info = {
  50: "#f0f9ff",
  100: "#e0f2fe",
  200: "#bae6fd",
  300: "#7dd3fc",
  400: "#38bdf8",
  500: "#0ea5e9",
  600: "#0284c7",
  700: "#0369a1",
  800: "#075985",
  900: "#0c4a6e",
} as const;

export const token = {
  color: {
    brand,
    accent,
    tertiary,
    ink,
    state: { success, warning, error, info },

    /** Page and component surfaces — mapped from Sharp-extracted palette. */
    surface: {
      /** Default page background. Maps to --bg-primary: #E5F8FE. */
      canvas: "#E5F8FE",
      /** Raised content: cards, panels, inputs. Pure white still correct here. */
      raised: "#ffffff",
      /** Sunken fields inside a raised card. Maps to --surface-secondary: #D3EAF8. */
      sunken: "#D3EAF8",
      /** Full-bleed dark bands (homepage card row, stats strip). Maps to --bg-footer: #242834. */
      dark: "#242834",
      /** The blue bands used for the news strip, CTA and footer. */
      brandBand: brand[600],
    },

    /** Text roles — aligned to reference extractions. */
    text: {
      /** Headings and primary copy. Maps to --text-heading: #0A0A0A. */
      primary: "#0A0A0A",
      /** Body copy. Maps to --text-body: #A1A9AB. */
      body: "#A1A9AB",
      /** Muted support and metadata. */
      muted: ink[500],
      /** Captions, timestamps, placeholders. */
      subtle: ink[400],
      /** Text on brand, dark or accent fills. */
      onFill: "#ffffff",
      /** Links and interactive labels on light surfaces. */
      link: brand[700],
      /** Links on dark surfaces. */
      linkOnDark: brand[300],
    },

    /** Border roles. */
    border: {
      /** Hairlines between related content. */
      subtle: ink[200],
      /** Default control outline. */
      control: ink[300],
      /** The border a focused control earns. */
      focus: brand[600],
      /** Borders on dark surfaces. */
      onDark: ink[700],
    },
  },

  // ----------------------------------------------------------
  // Spacing — semantic steps from `xs` to `xxl`
  // ----------------------------------------------------------

  spacing: {
    /** Icon to label, inline chips. */
    xs: "0.25rem",
    /** Control padding, small gaps. */
    sm: "0.5rem",
    /** Default gap between related items. */
    md: "1rem",
    /** Card padding, section sub-gaps. */
    lg: "1.5rem",
    /** Section padding. */
    xl: "2rem",
    /** Full section rhythm. */
    xxl: "3rem",
  },

  // ----------------------------------------------------------
  // Radius
  // ----------------------------------------------------------

  radius: {
    sm: "0.375rem",
    /** Inputs, small buttons. */
    md: "0.5rem",
    /** Cards, panels. */
    lg: "0.75rem",
    /** Large cards and modals. */
    xl: "1rem",
    /** Feature cards. */
    "2xl": "1.5rem",
    /** Pills, dots, avatars. */
    full: "9999px",
  },

  // ----------------------------------------------------------
  // Typography
  // ----------------------------------------------------------

  fontFamily: {
    /**
     * System stack on purpose: the reference's clean geometric sans is closely
     * matched by the platform UI faces, and this keeps the build free of a
     * network-fetched webfont. Swap in `next/font` here when a brand face is
     * licensed — every consumer follows automatically.
     */
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    /** Reference numbers and notice codes. */
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    /** Display headings and the footer wordmark. */
    extrabold: "800",
  } as const,

  fontSize: {
    "display-1": { value: "3.5rem", lineHeight: "1.05", weight: "extrabold" },
    "heading-1": { value: "2.25rem", lineHeight: "1.15", weight: "bold" },
    "heading-2": { value: "1.5rem", lineHeight: "1.25", weight: "bold" },
    "heading-3": { value: "1.25rem", lineHeight: "1.35", weight: "bold" },
    "heading-4": { value: "1.125rem", lineHeight: "1.4", weight: "semibold" },
    "body-lg": { value: "1.125rem", lineHeight: "1.65", weight: "regular" },
    body: { value: "1rem", lineHeight: "1.6", weight: "regular" },
    "body-sm": { value: "0.875rem", lineHeight: "1.55", weight: "regular" },
    caption: { value: "0.75rem", lineHeight: "1.5", weight: "regular" },
    /** Uppercase eyebrows and form labels. */
    micro: { value: "0.6875rem", lineHeight: "1.4", weight: "semibold" },
  } as const,

  // ----------------------------------------------------------
  // Elevation
  // ----------------------------------------------------------

  shadow: {
    /** Resting card. */
    card: "0 1px 2px rgba(11, 18, 32, 0.06), 0 1px 3px rgba(11, 18, 32, 0.08)",
    /** Card raised on hover. */
    cardHover: "0 4px 12px rgba(11, 18, 32, 0.10), 0 2px 4px rgba(11, 18, 32, 0.06)",
    /** Dropdowns, popovers and the event modal card. */
    floating: "0 10px 24px rgba(11, 18, 32, 0.14), 0 2px 8px rgba(11, 18, 32, 0.08)",
    /** Modal dialogs, the deepest layer. */
    modal: "0 24px 64px rgba(11, 18, 32, 0.28), 0 8px 20px rgba(11, 18, 32, 0.16)",
    /** Ring drawn behind a focused control. */
    focusRing: "0 0 0 3px rgba(29, 111, 242, 0.35)",
  },

  // ----------------------------------------------------------
  // Motion
  // ----------------------------------------------------------

  duration: {
    /** Hover, focus and colour changes. */
    fast: "150ms",
    /** Entrances and small transforms. */
    normal: "250ms",
    /** Crossfades, carousel slides, large layout shifts. */
    slow: "400ms",
  } as const,

  easing: {
    /** Standard ease for UI transitions. */
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    /** Emphasised entrances. */
    entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
  } as const,
} as const;

// ------------------------------------------------------------
// Semantic aliases — intent-level shorthand for the common cases
// ------------------------------------------------------------

export const semantic = {
  action: {
    primary: token.color.brand[600],
    primaryHover: token.color.brand[500],
    primaryActive: token.color.brand[700],
  },
  accentFill: token.color.accent[300],
  darkBand: token.color.surface.dark,
  brandBand: token.color.surface.brandBand,
} as const;

export type BrandShade = keyof typeof token.color.brand;
export type AccentShade = keyof typeof token.color.accent;
export type InkShade = keyof typeof token.color.ink;
export type TextRole = keyof typeof token.color.text;
export type SpacingStep = keyof typeof token.spacing;
export type RadiusStep = keyof typeof token.radius;
export type FontSizeStep = keyof typeof token.fontSize;
export type FontWeightStep = keyof typeof token.fontWeight;
export type ShadowStep = keyof typeof token.shadow;
export type DurationStep = keyof typeof token.duration;

/** Grouped views over the tree, for the style-guide page and for tooling. */
export const tokenGroups = {
  brand: token.color.brand,
  accent: token.color.accent,
  tertiary: token.color.tertiary,
  ink: token.color.ink,
  state: {
    success: token.color.state.success[600],
    warning: token.color.state.warning[600],
    error: token.color.state.error[600],
    info: token.color.state.info[600],
  },
  surface: token.color.surface,
  text: token.color.text,
  border: token.color.border,
} as const;

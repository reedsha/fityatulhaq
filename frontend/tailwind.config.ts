import type { Config } from "tailwindcss";

import { token, type FontWeightStep } from "./src/styles/designTokens";

/**
 * Tailwind is the delivery mechanism for the design tokens, not a second source
 * of truth: every colour, radius, shadow, duration and type step below is read
 * from `src/styles/designTokens.ts`. Change a token and the utilities follow.
 *
 * Existing scales (slate, emerald, numeric spacing) are deliberately retained in
 * `extend` — screens that have not been migrated yet keep rendering while they
 * wait for their turn.
 */

/**
 * Turns the token type scale into Tailwind's `[size, { lineHeight, fontWeight }]`
 * shape, so one class such as `text-heading-2` carries its size, leading and
 * weight together and a heading cannot drift out of the hierarchy.
 */
function typographyScale(): Record<
  string,
  [string, { lineHeight: string; fontWeight: string }]
> {
  return Object.fromEntries(
    Object.entries(token.fontSize).map(([step, spec]) => [
      step,
      [
        spec.value,
        {
          lineHeight: spec.lineHeight,
          fontWeight: token.fontWeight[spec.weight as FontWeightStep],
        },
      ],
    ]),
  );
}

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/context/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: token.color.brand,
        accent: token.color.accent,
        tertiary: token.color.tertiary,
        ink: token.color.ink,
        /** Surface roles — page canvas, sunken fields, full-bleed dark bands. */
        surface: {
          canvas: token.color.surface.canvas,
          sunken: token.color.surface.sunken,
          dark: token.color.surface.dark,
        },
        "state-success": token.color.state.success,
        "state-warning": token.color.state.warning,
        "state-error": token.color.state.error,
        "state-info": token.color.state.info,
      },

      borderRadius: {
        DEFAULT: token.radius.md,
        sm: token.radius.sm,
        md: token.radius.md,
        lg: token.radius.lg,
        xl: token.radius.xl,
        "2xl": token.radius["2xl"],
        full: token.radius.full,
      },

      spacing: {
        xs: token.spacing.xs,
        sm: token.spacing.sm,
        md: token.spacing.md,
        lg: token.spacing.lg,
        xl: token.spacing.xl,
        xxl: token.spacing.xxl,
      },

      fontFamily: {
        sans: token.fontFamily.sans.split(", ").map((face) => face.replace(/^"|"$/g, "")),
        mono: token.fontFamily.mono.split(", ").map((face) => face.replace(/^"|"$/g, "")),
      },

      fontSize: typographyScale(),

      boxShadow: {
        card: token.shadow.card,
        "card-hover": token.shadow.cardHover,
        floating: token.shadow.floating,
        modal: token.shadow.modal,
        "focus-ring": token.shadow.focusRing,
      },

      transitionDuration: {
        fast: token.duration.fast,
        normal: token.duration.normal,
        slow: token.duration.slow,
      },

      transitionTimingFunction: {
        standard: token.easing.standard,
        entrance: token.easing.entrance,
      },
    },
  },
  plugins: [],
};

export default config;

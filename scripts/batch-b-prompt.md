# Batch B — Design System Migration (Component Overhaul)

## Objective
Replace every remaining hardcoded Tailwind colour utility in the frontend codebase with semantic token references from `src/styles/designTokens.ts`. This ensures visual consistency across all pages and eliminates drift when tokens change.

## Model
DeepSeek v4.1 Flash — complex multi-file coordinated refactoring.

## Scope (8 files only)

These files use raw colour utilities (`slate-*`, `white`, `emerald-400`) that must migrate to token-driven classes:

### 1. `frontend/src/app/layout.tsx` (line 30)

```tsx
// BEFORE:
<body className="min-h-screen bg-slate-50 text-slate-900 antialiased">

// AFTER:
<body className="min-h-screen bg-[color:var(--color-token-surface-canvas)] text-[color:var(--color-token-text-primary)] antialiased">
```

**Rationale:** `--bg-primary` maps to `#E5F8FE` (page canvas). `--text-heading` maps to `#0A0A0A` (primary text). These are the root-level colours that affect every page.

---

### 2. `frontend/src/app/dashboard/page.tsx` (line 14)

```tsx
// BEFORE:
<div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">

// AFTER:
<div className="flex min-h-screen items-center justify-center bg-[color:var(--color-token-surface-canvas)] px-4 py-10 sm:px-6">
```

---

### 3. `frontend/src/app/terms/page.tsx` (lines 26, 32)

```tsx
// BEFORE:
<p className="text-sm text-slate-600">

// AFTER:
<p className="text-sm text-[color:var(--color-token-text-muted)]">
```

Apply to both occurrences.

---

### 4. `frontend/src/components/auth/FormField.tsx` (lines 27–30, 84, 87, 116)

This is the most involved file. Every colour utility must move to token equivalents:

```tsx
// BEFORE:
const BASE_INPUT_CLASSES =
  "mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50";
const NORMAL_INPUT_CLASSES =
  "border-slate-300 focus:border-emerald-500 focus:ring-emerald-200";
const ERROR_INPUT_CLASSES = "border-red-300 focus:border-red-500 focus:ring-red-200";

// Line 84: <label htmlFor={id} className="block text-sm font-medium text-slate-700">
// Line 87: <span className="ml-1 font-normal text-slate-500">(optional)</span>
// Line 116: <p id={hintId} className="mt-1 text-xs text-slate-500">

// AFTER:
const BASE_INPUT_CLASSES =
  "mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[color:var(--color-token-surface-raised)]";
const NORMAL_INPUT_CLASSES =
  "border-[color:var(--color-token-border-control)] focus:border-[color:var(--color-token-focus)] focus:ring-[color:var(--color-token-brand-500)]/20";
const ERROR_INPUT_CLASSES = "border-[color:var(--color-token-state-error-300)] focus:border-[color:var(--color-token-state-error-500)] focus:ring-[color:var(--color-token-state-error-500)]/20";

// Label: className="block text-sm font-medium text-[color:var(--color-token-text-primary)]"
// Optional span: className="ml-1 font-normal text-[color:var(--color-token-text-muted)]"
// Hint paragraph: className="mt-1 text-xs text-[color:var(--color-token-text-muted)]"
```

**Mapping rationale:**
- `disabled:bg-slate-50` → surface-raised (the input background when disabled)
- `border-slate-300` → `token.border.control` (#ccd9e4)
- `focus:border-emerald-500` → `token.border.focus` (#015C98 — the brand primary)
- `focus:ring-emerald-200` → transparent wash of the focus colour (use opacity suffix)
- `text-slate-700` → text-primary (#0A0A0A)
- `text-slate-500` → text-muted (already defined in tokens)
- Error ring uses `state-error` scale from designTokens

---

### 5. `frontend/src/components/auth/OtpVerification.tsx` (lines 88, 94)

```tsx
// BEFORE (line 88):
<span className="text-slate-600">Didn&apos;t receive the code?</span>

// AFTER:
<span className="text-[color:var(--color-token-text-muted)]">Didn&apos;t receive the code?</span>

// BEFORE (line 94):
className="font-medium text-emerald-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"

// AFTER:
className="font-medium text-[color:var(--color-token-state-success-700)] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[color:var(--color-token-state-success-500)]/30 disabled:cursor-not-allowed disabled:text-[color:var(--color-token-text-subtle)] disabled:no-underline"
```

**Mapping rationale:**
- `emerald-700` → `state.success[700]` — we already have a green success palette
- `emerald-300` ring → `state.success[500]` at 30% opacity
- `slate-400` disabled text → `text.subtle` (#a1a9ab)

---

### 6. `frontend/src/components/auth/ResetPasswordForm.tsx` (line 137)

```tsx
// BEFORE:
<p className="text-sm text-slate-600">

// AFTER:
<p className="text-sm text-[color:var(--color-token-text-muted)]">
```

---

### 7. `frontend/src/components/auth/VerifyEmailForm.tsx` (line 124)

```tsx
// BEFORE:
<p className="mt-5 text-center text-sm text-slate-600">

// AFTER:
<p className="mt-5 text-center text-sm text-[color:var(--color-token-text-muted)]">
```

---

### 8. `frontend/src/components/auth/VerifyResetCodeForm.tsx` (line 98)

```tsx
// BEFORE:
<p className="text-sm text-slate-600">

// AFTER:
<p className="text-sm text-[color:var(--color-token-text-muted)]">
```

---

### 9. `frontend/src/components/layout/Footer.tsx` (multiple lines)

This footer uses `slate-900` (dark band), `slate-300` (text on dark), `slate-700` (borders), `slate-500` (copyright), and `emerald-400` (hover accents). All must migrate:

```tsx
// Line 47 — link on dark band:
// BEFORE: className="text-sm text-slate-300 transition hover:text-emerald-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
// AFTER:    className="text-sm text-[color:var(--color-token-text-on-dark)] transition hover:text-[color:var(--color-token-accent-500)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-token-accent-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-token-surface-dark)]"

// Line 67 — footer container:
// BEFORE: className="w-full bg-slate-900"
// AFTER:   className="w-full bg-[color:var(--color-token-surface-dark)]"

// Line 73 — description paragraph:
// BEFORE: className="mt-3 max-w-xs text-sm leading-relaxed text-slate-300"
// AFTER:   className="mt-3 max-w-xs text-sm leading-relaxed text-[color:var(--color-token-text-on-dark)]"

// Line 88 — contact address:
// BEFORE: className="mt-4 space-y-2.5 text-sm not-italic text-slate-300"
// AFTER:   className="mt-4 space-y-2.5 text-sm not-italic text-[color:var(--color-token-text-on-dark)]"

// Line 119 — social icons:
// BEFORE: className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:border-emerald-400 hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
// AFTER:  className="flex h-8 w-8 items-center justify-center rounded-md border border-[color:var(--color-token-border-onDark)] text-[color:var(--color-token-text-on-dark)] transition hover:border-[color:var(--color-token-accent-500)] hover:text-[color:var(--color-token-accent-500)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-token-accent-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-token-surface-dark)]"

// Line 131 — divider:
// BEFORE: className="border-t border-slate-800"
// AFTER:   className="border-t border-[color:var(--color-token-border-onDark)]"

// Line 133 — copyright:
// BEFORE: className="text-center text-xs text-slate-500"
// AFTER:   className="text-center text-xs text-[color:var(--color-token-text-subtle)]"
```

**Additional note:** The "FityatulHaq" wordmark in the footer (line ~70) currently renders as `text-emerald-400`. Change it to `text-[color:var(--color-token-brand-400)]` to tie the logo to the primary brand palette.

---

## Rules

1. **Do NOT modify anything except colour-related className values.** Spacing, layout, animation, structural classes stay exactly as-is.
2. **Do NOT import `token` into any of these files.** We use CSS variable injection via arbitrary values (the `[color:var(--name)]` pattern). If your build doesn't support this, add the necessary mappings to `tailwind.config.ts`'s `extend.colors` section instead.
3. **Preserve existing logic, props, TypeScript types, JSX structure, and accessibility attributes.** Only touch `className` strings.
4. **No new dependencies or imports required.** This is purely a class-string replacement task.
5. **After editing, verify with:**
   ```bash
   cd frontend && npx tsc --noEmit
   ```
   Zero errors required before reporting completion.

## Verification

Run this after all edits:
```bash
cd C:\Users\muham\OneDrive\Documents\fityatulhaq\frontend
npx tsc --noEmit
npm run build 2>&1 | Select-String -Pattern "error" -CaseSensitive:$false
```

Report back with:
- Which files were modified (path list)
- How many className replacements per file
- tsc result (pass/fail + error count)
- Build result (success or failure details)

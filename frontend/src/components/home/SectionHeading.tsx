import type { ReactElement } from "react";

export interface SectionHeadingProps {
  title: string;
  /** Right-aligned action, typically a "view all" link or a subtitle. */
  action?: ReactElement;
}

/**
 * Heading shared by every home section: the title and the emerald rule, with an
 * optional right-aligned action. Kept in its own module so the sections do not
 * have to import from one another to share it.
 */
export function SectionHeading({ title, action }: SectionHeadingProps): ReactElement {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-heading-2 tracking-tight text-ink-900">{title}</h2>
        <div aria-hidden="true" className="mt-2 h-px w-24 bg-brand-700" />
      </div>

      {action}
    </div>
  );
}

import { Heart, MessageCircle, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

export interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Shell for every authentication screen.
 *
 * Matches the approved reference: a full-bleed brand-blue canvas with the card
 * centred on it, and the three-point feature strip beneath — the strip sits
 * outside the card so it reads as site chrome rather than part of the form.
 */
export default function AuthLayout({ children }: AuthLayoutProps): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-brand-600">
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <main className="flex w-full max-w-md flex-col items-center">{children}</main>
      </div>

      <section
        aria-label="Why join FityatulHaq"
        className="border-t border-brand-500/40 bg-brand-50"
      >
        <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {AUTH_FEATURES.map((feature) => (
            <li key={feature.title} className="flex flex-col items-center text-center">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white"
              >
                <feature.icon className="h-6 w-6" />
              </span>

              <h2 className="mt-3 text-heading-4 text-ink-900">{feature.title}</h2>
              <p className="mt-1 max-w-[16rem] text-caption leading-relaxed text-ink-500">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

interface AuthFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface AuthFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * The three membership promises shown under the auth card. Icons are referenced
 * (not rendered) at module scope so the list stays data and the layout stays
 * presentational.
 */
const AUTH_FEATURES: AuthFeature[] = [
  {
    title: "Member activities",
    description: "Programme schedules, activities and skills-building workshops.",
    icon: Users,
  },
  {
    title: "Member discussions",
    description: "Ask questions and share experience on the member webboard.",
    icon: MessageCircle,
  },
  {
    title: "Charity points",
    description: "Earn rewards for the good you put into the community.",
    icon: Heart,
  },
];

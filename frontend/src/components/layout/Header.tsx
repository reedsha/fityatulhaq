"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

import fityatulhaqWhiteLogo from "@/assets/logos/fityatulhaq-white.png";
import { useAuth } from "@/context/AuthContext";

/** Shared focus treatment so keyboard focus is always visible on interactive elements. */
export const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

/**
 * Focus treatment for elements sitting on the dark navbar surface. Mirrors the
 * ring the dashboard's lime CTA uses (`ring-accent-300` with a `brand-950`
 * offset) so focus stays visible against `bg-brand-950/95`.
 */
export const FOCUS_RING_DARK =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950";

export interface HeaderNavLink {
  label: string;
  href: string;
}

export interface HeaderNav {
  label: string;
  href: string;
  /** Optional sub-navigation, rendered as a keyboard-accessible disclosure. */
  children?: HeaderNavLink[];
}

export interface HeaderProps {
  /** Section links. Defaults to the primary site navigation. */
  navigation?: HeaderNav[];
}

const DEFAULT_NAVIGATION: HeaderNav[] = [
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ข่าวสาร", href: "/news" },
  { label: "ประกาศ", href: "/announcements" },
  { label: "คลังความรู้", href: "/knowledge" },
  { label: "บริจาค", href: "/donate" },
  { label: "ติดต่อเรา", href: "/contact" },
  {
    label: "เว็บบอร์ด",
    href: "/webboard",
    children: [
      { label: "ทั่วไป", href: "/webboard/general" },
      { label: "ดูแลเยาวชน", href: "/webboard/youth-care" },
    ],
  },
];

/**
 * A route is active on an exact match or when it is a prefix of the current
 * path (`/webboard` matches `/webboard/general`), so a section stays
 * highlighted while the visitor reads inside it.
 */
function isActiveRoute(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavEntryActive(entry: HeaderNav, pathname: string): boolean {
  const childActive =
    entry.children?.some((child) => isActiveRoute(child.href, pathname)) ?? false;

  return isActiveRoute(entry.href, pathname) || childActive;
}

/**
 * Dashboard navbar DNA: `h-16` rail, caption-size links with wide tracking,
 * and the active section marked by the lime underline accent instead of the
 * old light-theme border swap.
 */
const NAV_LINK_BASE_CLASSES = `flex h-16 items-center gap-1 border-b-2 px-1 text-caption font-semibold tracking-wider transition duration-fast ease-standard motion-reduce:transition-none ${FOCUS_RING_DARK}`;

const NAV_LINK_IDLE_CLASSES =
  "border-transparent text-ink-300 hover:border-ink-600 hover:text-ink-50";

const NAV_LINK_ACTIVE_CLASSES = "border-accent-300 text-ink-50";

/** Collapsible sub-navigation inside the mobile drawer. */
function DrawerDisclosure(props: {
  entry: HeaderNav;
  isActive: boolean;
  pathname: string;
  onSelect: () => void;
}): ReactElement {
  const { entry, isActive, pathname, onSelect } = props;
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <div>
      <button
        type="button"
        onClick={(): void => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-current={isActive ? "page" : undefined}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-body font-medium transition duration-fast ease-standard motion-reduce:transition-none ${
          isActive
            ? "bg-ink-800/60 text-accent-300"
            : "text-ink-300 hover:bg-ink-800/60 hover:text-ink-50"
        } ${FOCUS_RING_DARK}`}
      >
        {entry.label}
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform duration-fast ease-standard motion-reduce:transition-none ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <ul className="ml-4 mt-1 space-y-1 border-l border-ink-700 pl-3">
          {entry.children?.map((child) => {
            const childActive = isActiveRoute(child.href, pathname);

            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={childActive ? "page" : undefined}
                  onClick={onSelect}
                  className={`block rounded-lg px-3 py-2 text-body-sm transition duration-fast ease-standard motion-reduce:transition-none ${
                    childActive
                      ? "bg-ink-800/60 text-accent-300"
                      : "text-ink-300 hover:bg-ink-800/60 hover:text-ink-50"
                  } ${FOCUS_RING_DARK}`}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Sticky site header: logo, primary navigation, auth actions.
 *
 * Restyled to the dashboard's navbar strip — deep-navy `bg-brand-950/95` with
 * backdrop blur, ink-50 wordmark, ink-300 links and the lime `accent-300`
 * primary pill — while every behaviour is unchanged.
 *
 * Auth state comes from `AuthProvider` — the same source every other screen
 * reads — so the Log in/Register pair and the profile avatar can never
 * disagree with the rest of the app. While the session is being restored the
 * actions render as a neutral skeleton, which also keeps the server-rendered
 * markup and the first client render identical.
 */
export function Header(props: HeaderProps): ReactElement {
  const { navigation = DEFAULT_NAVIGATION } = props;
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openMenuLabel, setOpenMenuLabel] = useState<string | null>(null);

  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const menuTriggersRef = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const closeDrawer = useCallback((): void => {
    setIsDrawerOpen(false);
  }, []);

  const closeDrawerToHamburger = useCallback((): void => {
    setIsDrawerOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  const toggleMenu = useCallback((label: string): void => {
    setOpenMenuLabel((current) => (current === label ? null : label));
  }, []);

  // Navigating dismisses every transient layer of the header.
  useEffect((): void => {
    setIsDrawerOpen(false);
    setOpenMenuLabel(null);
  }, [pathname]);

  // Escape dismisses whichever layer is open and restores focus to its trigger.
  useEffect(
    (): (() => void) | undefined => {
      if (!isDrawerOpen && openMenuLabel === null) {
        return undefined;
      }

      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== "Escape") {
          return;
        }

        if (isDrawerOpen) {
          closeDrawerToHamburger();
        }

        if (openMenuLabel !== null) {
          const trigger = menuTriggersRef.current.get(openMenuLabel);
          setOpenMenuLabel(null);
          trigger?.focus();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return (): void => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    },
    [isDrawerOpen, openMenuLabel, closeDrawerToHamburger],
  );

  // A pointer press outside the desktop nav closes the open dropdown.
  useEffect(
    (): (() => void) | undefined => {
      if (openMenuLabel === null) {
        return undefined;
      }

      const handlePointerDown = (event: PointerEvent): void => {
        const nav = desktopNavRef.current;

        if (nav !== null && event.target instanceof Node && !nav.contains(event.target)) {
          setOpenMenuLabel(null);
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);

      return (): void => {
        document.removeEventListener("pointerdown", handlePointerDown);
      };
    },
    [openMenuLabel],
  );

  // The drawer is a modal surface: the page behind it must not scroll.
  useEffect(
    (): (() => void) | undefined => {
      if (!isDrawerOpen) {
        return undefined;
      }

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return (): void => {
        document.body.style.overflow = previousOverflow;
      };
    },
    [isDrawerOpen],
  );

  // Moving focus into the drawer keeps keyboard users inside the opened layer.
  useEffect((): void => {
    if (isDrawerOpen) {
      drawerRef.current?.focus();
    }
  }, [isDrawerOpen]);

  /* Auth actions use the dashboard's action vocabulary. Signed-in members get
     an avatar pill (initial on `bg-brand-600` inside a lime ring) linking to
     `/profile`; anonymous visitors see the bordered Log in pill and the lime
     Register pill. While the session restores, a neutral skeleton holds the
     space so server and client markup agree. */
  const authActions = isLoading ? (
    <span
      aria-hidden="true"
      role="presentation"
      className="h-9 w-40 animate-pulse rounded-full bg-ink-800/60"
    />
  ) : isAuthenticated ? (
    <Link
      href="/profile"
      aria-label="ดูโปรไฟล์ของคุณ"
      className={`flex items-center gap-2 rounded-full bg-accent-300/10 p-1 pr-3 ring-1 ring-accent-300 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-accent-300/20 ${FOCUS_RING_DARK}`}
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600"
      >
        <span className="text-caption font-bold text-white">
          {user?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
        </span>
      </span>
      {/* `max-w-24` from the spec emits nothing on Tailwind 3.4 (its max-width
          scale carries no spacing steps), hence the arbitrary width. */}
      <span className="hidden max-w-[10rem] truncate text-caption text-ink-300 sm:inline">
        {user?.fullName ?? ""}
      </span>
    </Link>
  ) : (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className={`inline-flex items-center justify-center rounded-full border border-ink-700 px-3 py-1.5 text-caption font-medium text-ink-50 transition duration-fast ease-standard motion-reduce:transition-none hover:border-ink-500 ${FOCUS_RING_DARK}`}
      >
        เข้าสู่ระบบ
      </Link>
      <Link
        href="/register"
        className={`inline-flex items-center justify-center rounded-full bg-accent-300 px-4 py-1.5 text-caption font-bold text-brand-950 transition duration-fast ease-standard motion-reduce:transition-none hover:brightness-110 ${FOCUS_RING_DARK}`}
      >
        สมัครสมาชิก
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-ink-800/40 bg-brand-950/95 backdrop-blur-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-body-sm focus:font-semibold focus:text-white"
      >
        ข้ามไปที่เนื้อหา
      </a>

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo — the owner-supplied white FityatulHaq wordmark, sized to the
            navbar (`h-8`) on the dark `bg-brand-950/95` band. The brand mark
            routes to `/`, the reference-design landing page that absorbed the
            former `/dashboard`; anonymous visitors are forwarded on to `/login`
            by its session restore. */}
        <Link
          href="/"
          aria-label="FityatulHaq — ไปที่หน้าแรก"
          className={`flex items-center rounded ${FOCUS_RING_DARK}`}
        >
          <Image
            src={fityatulhaqWhiteLogo}
            alt="FityatulHaq"
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav ref={desktopNavRef} aria-label="เมนูหลัก" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {navigation.map((entry) => {
              const isActive = isNavEntryActive(entry, pathname);
              const isOpen = openMenuLabel === entry.label;

              if (entry.children === undefined) {
                return (
                  <li key={entry.label}>
                    <Link
                      href={entry.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`${NAV_LINK_BASE_CLASSES} ${
                        isActive ? NAV_LINK_ACTIVE_CLASSES : NAV_LINK_IDLE_CLASSES
                      }`}
                    >
                      {entry.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={entry.label} className="relative">
                  <button
                    type="button"
                    ref={(button): void => {
                      menuTriggersRef.current.set(entry.label, button);
                    }}
                    onClick={(): void => toggleMenu(entry.label)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    aria-current={isActive ? "page" : undefined}
                    className={`${NAV_LINK_BASE_CLASSES} ${
                      isActive ? NAV_LINK_ACTIVE_CLASSES : NAV_LINK_IDLE_CLASSES
                    }`}
                  >
                    {entry.label}
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 transition-transform duration-fast ease-standard motion-reduce:transition-none ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen ? (
                    <div className="absolute left-0 top-full z-50 w-48 rounded-xl border border-ink-700 bg-brand-950 p-2 shadow-floating">
                      <ul>
                        {entry.children.map((child) => {
                          const childActive = isActiveRoute(child.href, pathname);

                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                aria-current={childActive ? "page" : undefined}
                                onClick={(): void => setOpenMenuLabel(null)}
                                className={`block rounded-lg px-4 py-2 text-body-sm transition duration-fast ease-standard motion-reduce:transition-none ${
                                  childActive
                                    ? "bg-ink-800/60 text-accent-300"
                                    : "text-ink-300 hover:bg-ink-800/60 hover:text-ink-50"
                                } ${FOCUS_RING_DARK}`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">{authActions}</div>

        <button
          type="button"
          ref={hamburgerRef}
          onClick={(): void => (isDrawerOpen ? closeDrawerToHamburger() : setIsDrawerOpen(true))}
          aria-expanded={isDrawerOpen}
          aria-controls={isDrawerOpen ? "mobile-navigation" : undefined}
          aria-label={isDrawerOpen ? "ปิดเมนูนำทาง" : "เปิดเมนูนำทาง"}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-300 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-ink-800/60 hover:text-ink-50 lg:hidden ${FOCUS_RING_DARK}`}
        >
          {isDrawerOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      {isDrawerOpen ? (
        <div
          id="mobile-navigation"
          ref={drawerRef}
          tabIndex={-1}
          className="border-t border-ink-800/40 bg-brand-950 focus:outline-none lg:hidden"
        >
          <nav aria-label="เมนูหลักบนมือถือ" className="px-4 py-4 sm:px-6">
            <ul className="space-y-1">
              {navigation.map((entry) => {
                const isActive = isNavEntryActive(entry, pathname);

                if (entry.children === undefined) {
                  return (
                    <li key={entry.label}>
                      <Link
                        href={entry.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={closeDrawer}
                        className={`block rounded-lg px-3 py-2.5 text-body font-medium transition duration-fast ease-standard motion-reduce:transition-none ${
                          isActive
                            ? "bg-ink-800/60 text-accent-300"
                            : "text-ink-300 hover:bg-ink-800/60 hover:text-ink-50"
                        } ${FOCUS_RING_DARK}`}
                      >
                        {entry.label}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={entry.label}>
                    <DrawerDisclosure
                      entry={entry}
                      isActive={isActive}
                      pathname={pathname}
                      onSelect={closeDrawer}
                    />
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 border-t border-ink-800/40 pt-4">{authActions}</div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

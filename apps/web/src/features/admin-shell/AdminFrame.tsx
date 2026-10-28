"use client";
/** The admin area frame: a dark title bar ("Admin panel" and a link back to the site) and a side menu with the sections. */
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { Link, usePathname } from "@/shared/i18n";
import { isActive } from "@/shared/layout";

/** One section of the admin menu. */
interface AdminSection {
  /** Key under `admin.nav` in messages. */
  readonly key: "users" | "sizes" | "fabrics";
  /** Path without the language prefix. */
  readonly href: string;
  /** Other paths that belong to the same section (the rules page belongs to "fabrics"). */
  readonly alsoActiveOn?: readonly string[];
}

/** The sections that exist; the design's "overview" and "audit log" come later. */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { key: "users", href: "/admin/users" },
  { key: "sizes", href: "/admin/sizes" },
  { key: "fabrics", href: "/admin/fabrics", alsoActiveOn: ["/admin/fabric-rules"] },
];

/** Props for {@link AdminFrameView}. */
export interface AdminFrameViewProps {
  /** Current path without the language prefix. */
  readonly pathname: string;
  /** The page. */
  readonly children: ReactNode;
}

/**
 * Renders the frame for a given path (the pure part, easy to test).
 *
 * @param props - Current path and the page.
 * @returns The frame.
 */
export function AdminFrameView({ pathname, children }: Readonly<AdminFrameViewProps>): ReactElement {
  const t = useTranslations("admin");
  return (
    <div className="-mx-4 -my-6">
      <div className="bg-text text-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <span className="rounded-md bg-saffron px-2.5 text-sm font-semibold text-text">{t("badge")}</span>
          <Link
            href="/clients"
            className="ms-auto flex min-h-11 items-center text-base font-medium text-background underline-offset-4 hover:underline"
          >
            {t("backToSite")}
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-6 px-4 py-6">
        <nav
          aria-label={t("nav.label")}
          className="flex flex-1 basis-48 flex-col gap-1 rounded-lg bg-surface p-2 shadow-card"
        >
          {ADMIN_SECTIONS.map((section) => {
            const active = [section.href, ...(section.alsoActiveOn ?? [])].some((href) =>
              isActive(pathname, href),
            );
            return (
              <Link
                key={section.key}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-md px-3 text-base ${
                  active
                    ? "bg-primary-soft font-semibold text-primary"
                    : "font-medium text-text hover:bg-surface-hover"
                }`}
              >
                {t(`nav.${section.key}`)}
              </Link>
            );
          })}
        </nav>
        <div className="flex min-w-0 flex-4 basis-96 flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}

/** Props for {@link AdminFrame}. */
export interface AdminFrameProps {
  /** The page. */
  readonly children: ReactNode;
}

/**
 * Renders the frame for the current page.
 *
 * @param props - The page.
 * @returns The frame.
 */
export function AdminFrame({ children }: Readonly<AdminFrameProps>): ReactElement {
  return <AdminFrameView pathname={usePathname()}>{children}</AdminFrameView>;
}

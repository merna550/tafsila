"use client";
/** Signed-in navigation bar: links to the main areas and the user's initial; the link of the current page is marked. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link, usePathname } from "@/shared/i18n";

/** One link of the bar. */
export interface NavItem {
  /** Key under `nav` in messages. */
  readonly key: "clients" | "settings" | "admin";
  /** Path without the language prefix. */
  readonly href: string;
}

/**
 * The links of the bar. "My designs" and the credits chip come with their milestones (credits: M7).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "clients", href: "/clients" },
  { key: "settings", href: "/settings" },
];

/** The admin link, shown to admins only (the pages and the API check the role again). */
export const ADMIN_NAV_ITEM: NavItem = { key: "admin", href: "/admin/users" };

/**
 * Tells whether an item's page is the current area; the admin link covers everything under /admin.
 *
 * @param pathname - Current path without the language prefix.
 * @param item - Nav item.
 * @returns True when the item is active.
 */
function isItemActive(pathname: string, item: NavItem): boolean {
  return isActive(pathname, item.key === "admin" ? "/admin" : item.href);
}

/**
 * Tells whether the current path is the item's page or below it.
 *
 * @param pathname - Current path without the language prefix.
 * @param href - Item path.
 * @returns True when the item is active.
 */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Props for {@link AppNavView}. */
export interface AppNavViewProps {
  /** Current path without the language prefix. */
  readonly pathname: string;
  /** Letter shown in the avatar (empty hides it). */
  readonly initial: string;
  /** True for admins: adds the admin link. */
  readonly isAdmin?: boolean;
}

/**
 * Renders the bar for a given path (the pure part, easy to test).
 *
 * @param props - Current path, the user's initial and whether to show the admin link.
 * @returns The navigation bar.
 */
export function AppNavView({ pathname, initial, isAdmin = false }: Readonly<AppNavViewProps>): ReactElement {
  const t = useTranslations("nav");
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
        <nav aria-label={t("label")} className="flex flex-1 flex-wrap gap-1">
          {items.map((item) => {
            const active = isItemActive(pathname, item);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-md px-4 text-base font-semibold ${
                  active ? "bg-primary-soft text-primary" : "text-text hover:bg-surface-hover"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        {initial ? (
          <span
            role="img"
            aria-label={t("account")}
            className="flex size-10 items-center justify-center rounded-full bg-accent text-lg font-semibold text-on-accent"
          >
            {initial}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Props for {@link AppNav}. */
export interface AppNavProps {
  /** Letter shown in the avatar. */
  readonly initial: string;
  /** True for admins (read from the session token on the server). */
  readonly isAdmin?: boolean;
}

/**
 * Renders the bar for the current page.
 *
 * @param props - The user's initial and whether the user is an admin.
 * @returns The navigation bar.
 */
export function AppNav({ initial, isAdmin }: Readonly<AppNavProps>): ReactElement {
  return <AppNavView pathname={usePathname()} initial={initial} isAdmin={isAdmin} />;
}

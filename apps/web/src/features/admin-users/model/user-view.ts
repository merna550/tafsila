/** Pure view-models of the admin users screens: what a table row and the detail page show, derived from API data. */
import type { AdminUser, AdminUserDetail } from "@tafsila/schemas";
import { formatRelativeTime, formatShortDate, type DateLocale } from "@/shared/format";

/** One row of the users table. */
export interface AdminUserRowView {
  /** User id (used for the link). */
  readonly id: string;
  /** Name, or null when the profile has none (the e-mail then leads). */
  readonly name: string | null;
  /** E-mail, or null. */
  readonly email: string | null;
  /** Phone number, or null. */
  readonly phone: string | null;
  /** True when the phone is verified. */
  readonly phoneVerified: boolean;
  /** Sign-up date as a short date. */
  readonly joined: string;
  /** Number of clients. */
  readonly clientCount: number;
  /** Last sign-in as relative time, or null when never. */
  readonly lastSignIn: string | null;
}

/**
 * Maps a list row of the API to the table row.
 *
 * @param user - User from the API.
 * @param now - The current time.
 * @param locale - App language.
 * @returns The row view.
 */
export function toAdminUserRow(user: AdminUser, now: Date, locale: DateLocale): AdminUserRowView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    phoneVerified: user.phoneVerifiedAt !== null,
    joined: formatShortDate(new Date(user.createdAt), now, locale),
    clientCount: user.clientCount,
    lastSignIn: user.lastSignInAt ? formatRelativeTime(new Date(user.lastSignInAt), now, locale) : null,
  };
}

/** What the detail page shows. */
export interface AdminUserDetailView extends AdminUserRowView {
  /** Number of measurement sets (a count only, never the values). */
  readonly measurementSetCount: number;
  /** Language the user chose. */
  readonly locale: "ar" | "en";
  /** Role. */
  readonly role: "user" | "admin";
}

/**
 * Maps the detail response to the page data.
 *
 * @param user - User from the API.
 * @param now - The current time.
 * @param locale - App language.
 * @returns The detail view.
 */
export function toAdminUserDetail(user: AdminUserDetail, now: Date, locale: DateLocale): AdminUserDetailView {
  return {
    ...toAdminUserRow(user, now, locale),
    measurementSetCount: user.measurementSetCount,
    locale: user.locale,
    role: user.role,
  };
}

/**
 * Picks the main line of a row: the name, otherwise the e-mail, otherwise the phone.
 *
 * @param row - A row view.
 * @returns The text, or an empty string when the user has none of them.
 */
export function displayName(row: Pick<AdminUserRowView, "name" | "email" | "phone">): string {
  return row.name?.trim() || row.email || row.phone || "";
}

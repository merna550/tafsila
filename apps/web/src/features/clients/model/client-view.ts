/** Pure view-models of the clients screens: what a list row and the profile card show, derived from API data. */
import type { Client, MeasurementSet } from "@tafsila/schemas";
import { formatMonthYear, formatRelativeTime, type DateLocale } from "./format-relative-time";

/** The three forms of the one-line description under a client's name. */
export type ClientMeta =
  | { readonly kind: "none" }
  | { readonly kind: "size"; readonly size: string; readonly when: string }
  | { readonly kind: "custom"; readonly when: string };

/** One row of the clients list. */
export interface ClientRowView {
  /** Client id (used for the link). */
  readonly id: string;
  /** Full name. */
  readonly name: string;
  /** Letter shown in the round avatar. */
  readonly initial: string;
  /** What to say under the name. */
  readonly meta: ClientMeta;
}

/** What the profile side card shows. */
export interface ClientProfileView {
  /** Client id. */
  readonly id: string;
  /** Full name. */
  readonly name: string;
  /** Letter shown in the round avatar. */
  readonly initial: string;
  /** Notes, or null when there are none. */
  readonly notes: string | null;
  /** Month and year she was added, for "client since March 2026". */
  readonly since: string;
}

/**
 * Takes the first letter of the first word, uppercased for Latin names (Arabic letters have no case).
 *
 * @param name - Full name.
 * @returns One character, or an empty string for an empty name.
 */
export function initialOf(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase() : "";
}

/**
 * Builds the meta line data of a client from the API summary.
 *
 * @param summary - The client's summary.
 * @param now - The current time.
 * @param locale - App language.
 * @returns "none" without sets, "size" when the newest set has a size label, otherwise "custom".
 */
export function toClientMeta(summary: Client["summary"], now: Date, locale: DateLocale): ClientMeta {
  if (summary.measurementSetCount === 0 || summary.lastMeasurementAt === null) return { kind: "none" };
  const when = formatRelativeTime(new Date(summary.lastMeasurementAt), now, locale);
  return summary.latestSizeLabel === null
    ? { kind: "custom", when }
    : { kind: "size", size: summary.latestSizeLabel, when };
}

/**
 * Maps a client to a list row.
 *
 * @param client - Client from the API.
 * @param now - The current time.
 * @param locale - App language.
 * @returns The row view.
 */
export function toClientRow(client: Client, now: Date, locale: DateLocale): ClientRowView {
  return {
    id: client.id,
    name: client.name,
    initial: initialOf(client.name),
    meta: toClientMeta(client.summary, now, locale),
  };
}

/**
 * Maps a client to the profile card.
 *
 * @param client - Client from the API.
 * @param locale - App language.
 * @returns The profile view.
 */
export function toClientProfileView(client: Client, locale: DateLocale): ClientProfileView {
  return {
    id: client.id,
    name: client.name,
    initial: initialOf(client.name),
    notes: client.notes,
    since: formatMonthYear(new Date(client.createdAt), locale),
  };
}

/** One measurement set as a card needs it (the values come from `measurement-summary.ts`). */
export interface MeasurementSetView {
  /** Set id (used for the link). */
  readonly id: string;
  /** Label such as "Summer 2026". */
  readonly label: string;
  /** Size the set started from, or null for custom measurements. */
  readonly sizeLabel: string | null;
  /** How long ago it was saved. */
  readonly when: string;
}

/**
 * Maps a measurement set to the card data.
 *
 * @param set - Set from the API.
 * @param now - The current time.
 * @param locale - App language.
 * @returns The card view.
 */
export function toMeasurementSetView(set: MeasurementSet, now: Date, locale: DateLocale): MeasurementSetView {
  return {
    id: set.id,
    label: set.label,
    sizeLabel: set.sizeLabel,
    when: formatRelativeTime(new Date(set.createdAt), now, locale),
  };
}

/** Shared class fragments so every control looks and focuses the same (tokens only; logical direction). */

/** Visible keyboard focus ring used by every interactive control. */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** Dimmed, non-interactive look for disabled controls. */
export const DISABLED = "disabled:cursor-not-allowed disabled:opacity-50";

/** Base look of text-like fields (input, textarea, select trigger); 44px minimum touch height. */
export const FIELD_BASE = `w-full rounded-md border border-border bg-surface px-3 text-base text-text placeholder:text-muted aria-invalid:border-danger ${FOCUS_RING} ${DISABLED}`;

/** Base look of small selection controls (checkbox, radio, switch). */
export const CONTROL_BASE = `shrink-0 border border-border bg-surface transition-colors duration-fast ${FOCUS_RING} ${DISABLED}`;

/**
 * Joins class names, skipping empty values.
 *
 * @param parts - Class strings, possibly undefined or empty.
 * @returns One space-separated class string.
 */
export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

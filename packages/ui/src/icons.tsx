/** Small decorative icons used inside controls; they are hidden from screen readers. */
import type { ReactElement } from "react";

/** Props for the icons: the CSS class sets size and colour. */
interface IconProps {
  /** Tailwind classes for size and colour. */
  readonly className?: string;
}

/**
 * Draws a check mark.
 *
 * @param props - Icon props.
 * @returns A decorative SVG.
 */
export function CheckIcon({ className }: Readonly<IconProps>): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 8.5l3.2 3.2L13 4.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Draws a downward chevron.
 *
 * @param props - Icon props.
 * @returns A decorative SVG.
 */
export function ChevronDownIcon({ className }: Readonly<IconProps>): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Draws an X (close) mark.
 *
 * @param props - Icon props.
 * @returns A decorative SVG.
 */
export function CloseIcon({ className }: Readonly<IconProps>): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Draws a chevron that points to the end of the line (right in English, left in Arabic) for "open this row".
 *
 * @param props - Icon props.
 * @returns A decorative SVG that flips with the reading direction.
 */
export function ChevronEndIcon({ className }: Readonly<IconProps>): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={`rtl:-scale-x-100 ${className ?? ""}`.trim()}
    >
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Draws a plus sign.
 *
 * @param props - Icon props.
 * @returns A decorative SVG.
 */
export function PlusIcon({ className }: Readonly<IconProps>): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Draws a magnifying glass.
 *
 * @param props - Icon props.
 * @returns A decorative SVG.
 */
export function SearchIcon({ className }: Readonly<IconProps>): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  );
}

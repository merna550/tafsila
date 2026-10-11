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

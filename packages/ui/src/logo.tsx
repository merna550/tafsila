/** Logo: the Tafsila mark (a teal square with a dashed cutting line and a pin head). */
import type { ReactElement } from "react";
import { cx } from "./styles";

/** Props for {@link Logo}. */
export interface LogoProps {
  /** Accessible name (already translated); leave out when the app name is written next to the mark. */
  readonly label?: string;
  /** Extra classes (size). */
  readonly className?: string;
}

/**
 * Renders the Tafsila logo mark. This is a PLACEHOLDER drawn for the M1 screen designs: the final
 * logo comes after M1, and replacing it is a change to this one file.
 *
 * @param props - Optional accessible name and classes.
 * @returns The logo SVG, decorative when no label is given.
 * @example
 * <Logo className="size-8" />
 */
export function Logo({ label, className }: Readonly<LogoProps>): ReactElement {
  return (
    <svg
      viewBox="0 0 56 56"
      className={cx("size-10 shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect x="4" y="4" width="48" height="48" rx="16" className="fill-primary" />
      <path
        d="M14 34 L42 22"
        className="stroke-background"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 5"
      />
      <circle cx="40" cy="36" r="5" className="fill-saffron" />
    </svg>
  );
}

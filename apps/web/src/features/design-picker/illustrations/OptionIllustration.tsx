/** Placeholder line drawing for one catalogue option (issue #241). */
import type { ReactElement } from "react";
import { findIllustration } from "./catalogue";
import type { IllustratedPath, IllustrationValue } from "./types";

/** Props of {@link OptionIllustration}. */
export interface OptionIllustrationProps<P extends IllustratedPath> {
  readonly path: P;
  readonly value: IllustrationValue<P>;
  readonly className?: string;
}

/**
 * Draws the option in the current text colour; pass it to `OptionCard`'s `illustration` prop.
 *
 * @param props - Catalogue path, option value and optional class.
 * @returns An svg, or null when no drawing exists for the value.
 */
export function OptionIllustration<P extends IllustratedPath>({
  path,
  value,
  className,
}: Readonly<OptionIllustrationProps<P>>): ReactElement | null {
  const drawing = findIllustration(path, value);
  if (drawing === undefined) return null;
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className === undefined ? "size-full" : `size-full ${className}`}
    >
      {drawing.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

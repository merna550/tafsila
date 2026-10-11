/** The sewing mannequin illustration of the sign-in screen design (decorative, with an accessible name). */
import type { ReactElement } from "react";

/** Props for {@link Mannequin}. */
interface MannequinProps {
  /** Accessible description (already translated). */
  readonly label: string;
}

/**
 * Draws the mannequin with a measuring tape, using design tokens only.
 *
 * @param props - The accessible label.
 * @returns The SVG.
 */
export function Mannequin({ label }: Readonly<MannequinProps>): ReactElement {
  return (
    <svg viewBox="0 0 300 340" className="block w-full max-w-72" role="img" aria-label={label}>
      <circle cx="150" cy="160" r="130" className="fill-background" />
      <rect
        x="140"
        y="22"
        width="20"
        height="26"
        rx="6"
        className="fill-surface stroke-border"
        strokeWidth="2"
      />
      <path
        d="M96 60 Q150 40 204 60 Q222 100 206 140 Q196 168 208 210 Q150 228 92 210 Q104 168 94 140 Q78 100 96 60 Z"
        className="fill-surface stroke-border"
        strokeWidth="2"
      />
      <path d="M150 50 V218" className="stroke-primary" strokeWidth="2" strokeDasharray="6 6" fill="none" />
      <path
        d="M118 56 Q128 120 112 214"
        className="stroke-primary"
        strokeWidth="2"
        strokeDasharray="6 6"
        fill="none"
        opacity=".6"
      />
      <path
        d="M182 56 Q172 120 188 214"
        className="stroke-primary"
        strokeWidth="2"
        strokeDasharray="6 6"
        fill="none"
        opacity=".6"
      />
      <path d="M150 220 V300" className="stroke-border" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M112 312 Q150 296 188 312"
        className="stroke-border"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M126 48 Q150 66 174 48 L184 54 Q180 120 196 176 L184 180 Q168 120 172 62 Q150 76 128 62 Q132 120 116 180 L104 176 Q120 120 116 54 Z"
        className="fill-saffron"
      />
    </svg>
  );
}

/** Badge: a small status label (a coloured tone plus text, never colour alone). */
import type { HTMLAttributes, ReactElement } from "react";
import { cx } from "./styles";

/** Tones a badge can take. */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

/** Props for {@link Badge}. */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Colour meaning; defaults to "neutral". */
  readonly tone?: BadgeTone;
}

/** Tailwind classes per tone (text colour on a bordered surface keeps AA contrast). */
export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-border text-muted",
  success: "border-success text-success",
  warning: "border-warning text-warning",
  danger: "border-danger text-danger",
  info: "border-info text-info",
};

/**
 * Renders a small status label.
 *
 * @param props - Tone, text and native span props.
 * @returns The badge element.
 * @example
 * <Badge tone="success">{t("order.paid")}</Badge>
 */
export function Badge({ tone = "neutral", className, ...rest }: Readonly<BadgeProps>): ReactElement {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border bg-surface px-2.5 text-sm font-semibold",
        BADGE_TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    />
  );
}

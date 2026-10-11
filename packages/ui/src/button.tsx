/** Button: the single button component used across Tafsila (variants instead of ad-hoc styles). */
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { DISABLED, FOCUS_RING, cx } from "./styles";

/** Visual styles a button can take. */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** Props for {@link Button}: all native button props plus a variant. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style; defaults to "primary". */
  readonly variant?: ButtonVariant;
}

/** Tailwind classes per variant; logical properties keep RTL and LTR correct. */
export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-border bg-surface text-text hover:bg-surface-hover",
  ghost: "text-primary hover:bg-surface-hover",
  danger: "bg-danger text-on-primary hover:opacity-90",
};

/**
 * Renders an accessible button with Tafsila's styles.
 *
 * @param props - Native button props plus `variant`.
 * @returns The button element.
 * @example
 * <Button onClick={startUpload}>{t("upload.start")}</Button>
 */
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: Readonly<ButtonProps>): ReactElement {
  const classes = cx(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-base font-semibold transition-colors duration-fast",
    FOCUS_RING,
    DISABLED,
    BUTTON_VARIANT_CLASSES[variant],
    className,
  );
  return <button type={type} className={classes} {...rest} />;
}

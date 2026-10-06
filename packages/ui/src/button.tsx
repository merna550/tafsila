/** Button: the single button component used across Tafsila (variants instead of ad-hoc styles). */
import type { ButtonHTMLAttributes, ReactElement } from "react";

/** Visual styles a button can take. */
export type ButtonVariant = "primary" | "secondary" | "ghost";

/** Props for {@link Button}: all native button props plus a variant. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style; defaults to "primary". */
  readonly variant?: ButtonVariant;
}

/** Tailwind classes per variant; logical properties keep RTL and LTR correct. */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-rose-700 text-white hover:bg-rose-800",
  secondary: "border border-rose-700 text-rose-700 hover:bg-rose-50",
  ghost: "text-rose-700 hover:bg-rose-50",
};

/**
 * Renders an accessible button with Tafsila's styles.
 *
 * @param props - Native button props plus `variant`.
 * @returns The button element.
 * @example
 * <Button onClick={startUpload}>ارفعي الصورة</Button>
 */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: Readonly<ButtonProps>): ReactElement {
  const classes = `rounded-lg px-5 py-2.5 text-base font-semibold transition-colors disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`;
  return <button type={type} className={classes.trim()} {...rest} />;
}

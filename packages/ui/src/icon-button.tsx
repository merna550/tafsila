/** IconButton: a square button holding only an icon; the accessible name is required. */
import type { ReactElement } from "react";
import { Button, type ButtonProps } from "./button";
import { cx } from "./styles";

/** Props for {@link IconButton}. */
export interface IconButtonProps extends Omit<ButtonProps, "aria-label"> {
  /** Accessible name read by screen readers (already translated). Required because there is no visible text. */
  readonly label: string;
}

/**
 * Renders a 44px square button with an icon child and an accessible name.
 *
 * @param props - Button props plus the required `label`.
 * @returns The icon button element.
 * @example
 * <IconButton label={t("common.close")} variant="ghost"><CloseIcon /></IconButton>
 */
export function IconButton({
  label,
  className,
  variant = "ghost",
  ...rest
}: Readonly<IconButtonProps>): ReactElement {
  return <Button aria-label={label} variant={variant} className={cx("w-11 px-0", className)} {...rest} />;
}

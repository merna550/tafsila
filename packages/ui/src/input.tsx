/** Input: a single-line text field with a 44px touch height. */
import type { InputHTMLAttributes, ReactElement } from "react";
import { FIELD_BASE, cx } from "./styles";

/** Props for {@link Input}: native input props; set `aria-invalid` (or use FormField) to show the error border. */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Renders a text input styled with tokens.
 *
 * @param props - Native input props.
 * @returns The input element.
 * @example
 * <Input id="name" aria-label={t("client.name")} />
 */
export function Input({ className, ...rest }: Readonly<InputProps>): ReactElement {
  return <input className={cx(FIELD_BASE, "min-h-11", className)} {...rest} />;
}

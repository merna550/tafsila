/** Textarea: a multi-line text field. */
import type { ReactElement, TextareaHTMLAttributes } from "react";
import { FIELD_BASE, cx } from "./styles";

/** Props for {@link Textarea}: native textarea props. */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Renders a textarea styled with tokens.
 *
 * @param props - Native textarea props.
 * @returns The textarea element.
 * @example
 * <Textarea rows={4} aria-label={t("order.notes")} />
 */
export function Textarea({ className, rows = 3, ...rest }: Readonly<TextareaProps>): ReactElement {
  return <textarea rows={rows} className={cx(FIELD_BASE, "min-h-24 py-2", className)} {...rest} />;
}

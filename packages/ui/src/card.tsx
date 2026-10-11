/** Card: a bordered surface that groups related content; optional header and footer slots. */
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { cx } from "./styles";

/** Props for {@link Card}. */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Optional heading shown at the top (already translated). */
  readonly title?: ReactNode;
  /** Optional footer slot, for example actions. */
  readonly footer?: ReactNode;
}

/**
 * Renders a surface with an optional title and footer.
 *
 * @param props - Title, footer, content and native div props.
 * @returns The card element.
 * @example
 * <Card title={t("client.details")} footer={<Button>{t("common.save")}</Button>}>...</Card>
 */
export function Card({ title, footer, className, children, ...rest }: Readonly<CardProps>): ReactElement {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm",
        className,
      )}
      {...rest}
    >
      {title ? <h3 className="text-lg font-semibold text-text">{title}</h3> : null}
      <div className="text-base text-text">{children}</div>
      {footer ? <div className="flex flex-wrap items-center gap-2 pt-1">{footer}</div> : null}
    </div>
  );
}

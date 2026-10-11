/** PageHeader: the title row of a page, with optional description and actions. */
import type { ReactElement, ReactNode } from "react";
import { cx } from "./styles";

/** Props for {@link PageHeader}. */
export interface PageHeaderProps {
  /** Page title (already translated); rendered as the page's h1. */
  readonly title: ReactNode;
  /** Optional line under the title. */
  readonly description?: ReactNode;
  /** Optional actions (buttons) shown at the end of the row. */
  readonly actions?: ReactNode;
  /** Extra classes. */
  readonly className?: string;
}

/**
 * Renders the page title row; actions wrap below the title on narrow screens.
 *
 * @param props - Title, description and actions.
 * @returns The header element.
 * @example
 * <PageHeader title={t("clients.title")} actions={<Button>{t("clients.add")}</Button>} />
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: Readonly<PageHeaderProps>): ReactElement {
  return (
    <header className={cx("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {description ? <p className="text-base text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

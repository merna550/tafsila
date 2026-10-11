/** EmptyState: the "nothing here yet" state of a data screen, with an optional next action. */
import type { ReactElement, ReactNode } from "react";
import { cx } from "./styles";

/** Props for {@link EmptyState}. */
export interface EmptyStateProps {
  /** Short heading (already translated). */
  readonly title: ReactNode;
  /** Optional explanation of what to do. */
  readonly description?: ReactNode;
  /** Optional decorative icon or picture. */
  readonly icon?: ReactNode;
  /** Optional action, for example a Button that creates the first item. */
  readonly action?: ReactNode;
  /** Extra classes. */
  readonly className?: string;
}

/**
 * Renders a centred empty message.
 *
 * @param props - Title, description, icon and action.
 * @returns The empty-state element.
 * @example
 * <EmptyState title={t("clients.empty")} action={<Button>{t("clients.add")}</Button>} />
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: Readonly<EmptyStateProps>): ReactElement {
  return (
    <div className={cx("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      {icon ? (
        <div aria-hidden="true" className="text-muted">
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {description ? <p className="max-w-prose text-base text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

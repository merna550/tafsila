/** StatTile: one big number with its label, used in dashboards and the admin overview. */
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { cx } from "./styles";

/** Props for {@link StatTile}. */
export interface StatTileProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** What the number counts (already translated). */
  readonly label: ReactNode;
  /** The number, or a placeholder such as "-" while it loads. */
  readonly value: ReactNode;
}

/**
 * Renders a label with a large value under it, as a small group a screen reader reads as "label: value".
 *
 * @param props - Label, value and native div props.
 * @returns The tile element.
 * @example
 * <StatTile label={t("admin.stats.users")} value={42} />
 */
export function StatTile({ label, value, className, ...rest }: Readonly<StatTileProps>): ReactElement {
  return (
    <div
      className={cx(
        "flex flex-col gap-1 rounded-lg border border-line bg-surface p-4 shadow-card",
        className,
      )}
      {...rest}
    >
      <dt className="text-base text-muted">{label}</dt>
      <dd className="m-0 text-3xl font-semibold text-text">{value}</dd>
    </div>
  );
}

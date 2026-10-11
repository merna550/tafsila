/** Spinner: an announced "busy" indicator for short waits (use Skeleton for page content). */
import type { ReactElement } from "react";
import { cx } from "./styles";

/** Props for {@link Spinner}. */
export interface SpinnerProps {
  /** Text read by screen readers (already translated), for example "Loading". */
  readonly label: string;
  /** Extra classes (size and colour). */
  readonly className?: string;
}

/**
 * Renders a spinning ring with a status role.
 *
 * @param props - Accessible label and classes.
 * @returns The spinner element.
 * @example
 * <Spinner label={t("common.loading")} />
 */
export function Spinner({ label, className }: Readonly<SpinnerProps>): ReactElement {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <span
        aria-hidden="true"
        className={cx(
          "size-6 animate-spin rounded-full border-2 border-current border-t-transparent text-primary motion-reduce:animate-none",
          className,
        )}
      />
    </span>
  );
}

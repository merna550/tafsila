/** ErrorState: the "could not load" state of a data screen, with a "Try again" button. */
import type { ReactElement, ReactNode } from "react";
import { Button } from "./button";
import { cx } from "./styles";

/** Props for {@link ErrorState}. */
export interface ErrorStateProps {
  /** Short heading (already translated). */
  readonly title: ReactNode;
  /** Optional explanation (already localized; never a stack or a status number). */
  readonly description?: ReactNode;
  /** Called when the user presses the retry button; the button is hidden when omitted. */
  readonly onRetry?: () => void;
  /** Retry button text (already translated), for example "Try again". Required with `onRetry`. */
  readonly retryLabel?: string;
  /** Optional request id shown for support. */
  readonly requestId?: ReactNode;
  /** Extra classes. */
  readonly className?: string;
}

/**
 * Renders a centred error message with an optional retry button.
 *
 * @param props - Title, description, retry handler and label.
 * @returns The error-state element (announced to screen readers).
 * @example
 * <ErrorState title={t("error.load")} onRetry={query.refetch} retryLabel={t("common.retry")} />
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  requestId,
  className,
}: Readonly<ErrorStateProps>): ReactElement {
  return (
    <div role="alert" className={cx("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      <h2 className="text-lg font-semibold text-danger">{title}</h2>
      {description ? <p className="max-w-prose text-base text-muted">{description}</p> : null}
      {requestId ? <p className="font-mono text-sm text-muted">{requestId}</p> : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

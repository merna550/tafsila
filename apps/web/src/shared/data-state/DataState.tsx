/** The three-states pattern: loading (Skeleton), empty (EmptyState) or error (ErrorState) instead of the data screen. */
import { EmptyState, Skeleton } from "@tafsila/ui";
import type { ReactElement, ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ApiErrorView, routeError } from "../error-display";
import type { Locale } from "../api";

/** Props for {@link DataState}. */
export interface DataStateProps {
  /** True while the first load runs. */
  readonly isPending: boolean;
  /** The load error, if any. */
  readonly error?: unknown;
  /** True when the load succeeded but there is nothing to show. */
  readonly isEmpty: boolean;
  /** Retries the load; passed to the "Try again" button. */
  readonly onRetry?: () => void;
  /** Heading of the empty state; defaults to a generic text in the page language. */
  readonly emptyTitle?: string;
  /** Optional action of the empty state, for example "Add the first client". */
  readonly emptyAction?: ReactNode;
  /** The data screen, rendered only when loaded and not empty. */
  readonly children: ReactNode;
}

/**
 * Picks what a data screen shows: skeleton while loading, ErrorState on error, EmptyState when empty, else the data.
 *
 * @param props - Query status flags and the content.
 * @returns The matching state element.
 * @example
 * <DataState isPending={q.isPending} error={q.error} isEmpty={q.data?.length === 0} onRetry={q.refetch}>{table}</DataState>
 */
export function DataState({
  isPending,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyAction,
  children,
}: Readonly<DataStateProps>): ReactElement {
  const t = useTranslations("errors");
  const locale = useLocale() as Locale;
  if (error) return <ApiErrorView route={routeError(error, "load", locale)} onRetry={onRetry} />;
  if (isPending) return <Skeleton variant="table" />;
  if (isEmpty) {
    return <EmptyState title={emptyTitle ?? t("emptyTitle")} action={emptyAction} />;
  }
  return <>{children}</>;
}

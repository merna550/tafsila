"use client";
/** Page-level view of an error: ErrorState with a localized message, a copyable reference and "Try again". */
import { Button, ErrorState } from "@tafsila/ui";
import { useState, type ReactElement } from "react";
import type { Locale } from "../api";
import { DEFAULT_LOCALE, ERROR_DISPLAY_MESSAGES } from "./messages";
import type { ErrorRoute } from "./route-error";

/** Props for {@link CopyReference}. */
interface CopyReferenceProps {
  /** The request id to show and copy. */
  readonly requestId: string;
  /** Language of the labels. */
  readonly locale: Locale;
}

/**
 * Shows the request id with a button that copies it to the clipboard.
 *
 * @param props - Request id and language.
 * @returns The reference line.
 */
function CopyReference({ requestId, locale }: Readonly<CopyReferenceProps>): ReactElement {
  const text = ERROR_DISPLAY_MESSAGES[locale];
  const [copied, setCopied] = useState(false);
  /** Copies the id; failures are ignored because the id stays visible for manual copy. */
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <span className="flex flex-wrap items-center justify-center gap-2">
      <span>{text.referenceLabel}</span>
      <bdi dir="ltr" data-testid="request-id">
        {requestId}
      </bdi>
      <Button variant="ghost" onClick={() => void copy()}>
        {copied ? text.copied : text.copyReference}
      </Button>
    </span>
  );
}

/** Props for {@link ApiErrorView}. */
export interface ApiErrorViewProps {
  /** The display decision from `routeError`. */
  readonly route: ErrorRoute;
  /** Called by "Try again"; the button is hidden when omitted or when retrying cannot help. */
  readonly onRetry?: () => void;
  /** Language; defaults to Arabic. */
  readonly locale?: Locale;
}

/**
 * Renders an error inside the page. Forbidden errors get the no-permission title and no retry button.
 *
 * @param props - Route, retry handler and language.
 * @returns The ErrorState element.
 */
export function ApiErrorView({
  route,
  onRetry,
  locale = DEFAULT_LOCALE,
}: Readonly<ApiErrorViewProps>): ReactElement {
  const text = ERROR_DISPLAY_MESSAGES[locale];
  const title = route.place === "no-permission" ? text.noPermissionTitle : text.pageErrorTitle;
  const canRetry = onRetry !== undefined && route.retryable;
  return (
    <ErrorState
      title={title}
      description={route.message}
      requestId={route.requestId ? <CopyReference requestId={route.requestId} locale={locale} /> : undefined}
      onRetry={canRetry ? onRetry : undefined}
      retryLabel={text.retry}
    />
  );
}

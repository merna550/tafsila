"use client";
/** Page-level view of an error: ErrorState with a localized message, a copyable reference and "Try again". */
import { Button, ErrorState } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import type { ErrorRoute } from "./route-error";

/** Props for {@link CopyReference}. */
interface CopyReferenceProps {
  /** The request id to show and copy. */
  readonly requestId: string;
}

/**
 * Shows the request id with a button that copies it to the clipboard.
 *
 * @param props - Request id.
 * @returns The reference line.
 */
function CopyReference({ requestId }: Readonly<CopyReferenceProps>): ReactElement {
  const t = useTranslations("errors");
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
      <span>{t("referenceLabel")}</span>
      <bdi dir="ltr" data-testid="request-id">
        {requestId}
      </bdi>
      <Button variant="ghost" onClick={() => void copy()}>
        {copied ? t("copied") : t("copyReference")}
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
}

/**
 * Renders an error inside the page. Forbidden errors get the no-permission title and no retry button.
 *
 * @param props - Route and retry handler.
 * @returns The ErrorState element.
 */
export function ApiErrorView({ route, onRetry }: Readonly<ApiErrorViewProps>): ReactElement {
  const t = useTranslations("errors");
  const title = route.place === "no-permission" ? t("noPermissionTitle") : t("pageErrorTitle");
  const canRetry = onRetry !== undefined && route.retryable;
  return (
    <ErrorState
      title={title}
      description={route.message}
      requestId={route.requestId ? <CopyReference requestId={route.requestId} /> : undefined}
      onRetry={canRetry ? onRetry : undefined}
      retryLabel={t("retry")}
    />
  );
}

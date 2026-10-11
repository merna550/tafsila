"use client";
/** Top-level React error boundary: an unexpected render error shows ErrorState and is reported to Sentry. */
import { ErrorState } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { Component, type ReactElement, type ReactNode } from "react";
import { ApiError } from "../api";
import { reportError } from "../monitoring";

/** Props for {@link AppErrorBoundary}. */
export interface AppErrorBoundaryProps {
  /** The app below the boundary. */
  readonly children: ReactNode;
  /** Sends the error to monitoring; defaults to Sentry through the monitoring wrapper. */
  readonly report?: (error: unknown, requestId?: string) => void;
}

/** Boundary state. */
interface AppErrorBoundaryState {
  /** True after a render error. */
  readonly failed: boolean;
}

/**
 * Fallback screen: generic text in the page language and a reload button; never a stack or an error name.
 *
 * @returns The ErrorState element.
 */
export function ErrorBoundaryFallback(): ReactElement {
  const t = useTranslations("errors");
  return (
    <ErrorState
      title={t("fallbackTitle")}
      description={t("fallbackDescription")}
      onRetry={() => window.location.reload()}
      retryLabel={t("retry")}
    />
  );
}

/** Catches errors thrown while rendering, shows {@link ErrorBoundaryFallback} and reports once with the request id. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { failed: false };

  /**
   * Switches to the fallback after a render error.
   *
   * @returns The failed state.
   */
  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  /**
   * Reports the error to monitoring, with the request id when it came from the API.
   *
   * @param error - The thrown value.
   */
  override componentDidCatch(error: unknown): void {
    const report = this.props.report ?? reportError;
    report(error, error instanceof ApiError ? error.requestId : undefined);
  }

  /**
   * Renders the children, or the fallback after an error.
   *
   * @returns The page.
   */
  override render(): ReactNode {
    return this.state.failed ? <ErrorBoundaryFallback /> : this.props.children;
  }
}

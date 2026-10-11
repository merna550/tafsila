"use client";
/** Client frame of every page: toasts, the top-level error boundary and AppShell with the connection banner. */
import { AppShell, ToastProvider } from "@tafsila/ui";
import type { ReactElement, ReactNode } from "react";
import {
  AppErrorBoundary,
  ConnectionBanner,
  DEFAULT_LOCALE,
  ERROR_DISPLAY_MESSAGES,
} from "../shared/error-display";

/**
 * Wraps the page content with the shared frame.
 *
 * @param props - The page content.
 * @param props.children - Page to render inside the shell.
 * @returns The framed page.
 */
export function AppFrame({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  const text = ERROR_DISPLAY_MESSAGES[DEFAULT_LOCALE];
  return (
    <ToastProvider closeLabel={text.toastClose} regionLabel={text.toastRegion} dir="rtl">
      <AppShell banner={<ConnectionBanner />} header={<strong>{text.brand}</strong>}>
        <AppErrorBoundary>{children}</AppErrorBoundary>
      </AppShell>
    </ToastProvider>
  );
}

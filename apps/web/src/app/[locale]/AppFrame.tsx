"use client";
/** Client frame of every page: toasts, the top-level error boundary and AppShell with the connection banner. */
import { AppShell, ToastProvider } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { AppErrorBoundary, ConnectionBanner } from "../../shared/error-display";
import { LocaleSwitch } from "../../shared/i18n";

/** Props for {@link AppFrame}. */
interface AppFrameProps {
  /** Page to render inside the shell. */
  readonly children: ReactNode;
  /** Text direction of the current language. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Wraps the page content with the shared frame.
 *
 * @param props - The page content and direction.
 * @returns The framed page.
 */
export function AppFrame({ children, dir }: Readonly<AppFrameProps>): ReactElement {
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  return (
    <ToastProvider closeLabel={errors("toastClose")} regionLabel={errors("toastRegion")} dir={dir}>
      <AppShell
        banner={<ConnectionBanner />}
        header={
          <div className="flex w-full items-center justify-between gap-4">
            <strong>{common("appName")}</strong>
            <LocaleSwitch />
          </div>
        }
      >
        <AppErrorBoundary>{children}</AppErrorBoundary>
      </AppShell>
    </ToastProvider>
  );
}

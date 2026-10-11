"use client";
/** Hook that sends any caught error to its fixed place: toast, sign-in redirect, or the route for the caller to render. */
import { useToast } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ErrorContext, Locale } from "../api";
import { reportError } from "../monitoring";
import { routeError, signInUrl, toApiError, type ErrorRoute } from "./route-error";

/**
 * Returns `handleError(error, context)`: shows toasts and redirects itself, reports unexpected errors to Sentry,
 * and returns the route so the caller can render field errors or an ErrorState.
 *
 * @returns The error handler.
 * @example
 * const handleError = useApiErrorHandler();
 * const save = useMutation({ mutationFn: saveClient, onError: (e) => handleError(e, "action") });
 */
export function useApiErrorHandler(): (error: unknown, context?: ErrorContext) => ErrorRoute {
  const { showToast } = useToast();
  const t = useTranslations("errors");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (error, context = "action") => {
      const route = routeError(error, context, locale);
      if (route.unexpected) reportError(error, toApiError(error).requestId);
      if (route.place === "redirect-sign-in") {
        showToast({ title: t("signInRedirect"), tone: "warning" });
        router.push(signInUrl(pathname));
      } else if (context === "action" && route.place !== "field") {
        showToast({ title: route.message, description: route.requestId, tone: "danger" });
      }
      return route;
    },
    [locale, pathname, router, showToast, t],
  );
}

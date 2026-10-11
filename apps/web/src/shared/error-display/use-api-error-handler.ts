"use client";
/** Hook that sends any caught error to its fixed place: toast, sign-in redirect, or the route for the caller to render. */
import { useToast } from "@tafsila/ui";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ErrorContext } from "../api";
import { reportError } from "../monitoring";
import { DEFAULT_LOCALE, ERROR_DISPLAY_MESSAGES } from "./messages";
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
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (error, context = "action") => {
      const route = routeError(error, context);
      if (route.unexpected) reportError(error, toApiError(error).requestId);
      if (route.place === "redirect-sign-in") {
        showToast({ title: ERROR_DISPLAY_MESSAGES[DEFAULT_LOCALE].signInRedirect, tone: "warning" });
        router.push(signInUrl(pathname));
      } else if (context === "action" && route.place !== "field") {
        showToast({ title: route.message, description: route.requestId, tone: "danger" });
      }
      return route;
    },
    [pathname, router, showToast],
  );
}

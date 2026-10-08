"use client";
/** Client component that starts error tracking and analytics from runtime configuration passed by the root layout. */
import type { PublicConfig } from "@tafsila/config";
import { useEffect, type ReactElement } from "react";
import { initAnalytics, trackAppOpenedOnce } from "../analytics";
import { initMonitoring } from "../monitoring";

/**
 * Initialises Sentry and PostHog once after hydration and fires `app_opened`.
 *
 * @param props - Component props.
 * @param props.config - Browser-safe configuration read on the server per request.
 * @returns Nothing visible.
 */
export function ObservabilityProvider({ config }: Readonly<{ config: PublicConfig }>): ReactElement | null {
  useEffect(() => {
    initMonitoring(config);
    initAnalytics(config);
    trackAppOpenedOnce();
  }, [config]);
  return null;
}

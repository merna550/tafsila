"use client";
/** Fixed connection banner: appears at the top of AppShell while the browser is offline (ADR-030). */
import { useSyncExternalStore, type ReactElement } from "react";
import { CLIENT_ERROR_MESSAGES, type Locale } from "../api";
import { DEFAULT_LOCALE } from "./messages";

/**
 * Subscribes to the browser's online and offline events.
 *
 * @param onChange - Called when the connection state changes.
 * @returns Function that unsubscribes.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Props for {@link ConnectionBannerView}. */
export interface ConnectionBannerViewProps {
  /** Whether the browser is offline. */
  readonly offline: boolean;
  /** Language; defaults to Arabic. */
  readonly locale?: Locale;
}

/**
 * Pure view of the banner: nothing while online.
 *
 * @param props - Offline flag and language.
 * @returns The banner, or null while online.
 */
export function ConnectionBannerView({
  offline,
  locale = DEFAULT_LOCALE,
}: Readonly<ConnectionBannerViewProps>): ReactElement | null {
  if (!offline) return null;
  return (
    <div role="status" className="bg-warning px-4 py-2 text-center text-sm font-medium text-on-primary">
      {CLIENT_ERROR_MESSAGES.network[locale]}
    </div>
  );
}

/**
 * Banner wired to the browser's connection state.
 *
 * @returns The banner while offline.
 */
export function ConnectionBanner(): ReactElement | null {
  const offline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  return <ConnectionBannerView offline={offline} />;
}

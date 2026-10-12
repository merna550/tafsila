"use client";
/** Application hook: sends an account that already verified its phone straight on, and records that the screen was shown. */
import { useEffect, useRef } from "react";
import { track } from "@/shared/analytics";
import { useRouter } from "@/shared/i18n";
import { usePhoneStatus } from "./use-phone-status";

/**
 * Looks up the phone status once. A verified account is redirected to `next`; otherwise `phone_verify_viewed` is sent
 * (once, with no number and no user id).
 *
 * @param next - Same-site path to open for a verified account.
 * @returns True until the status is known (and while the redirect happens), so the screen shows a placeholder.
 */
export function useVerifiedRedirect(next: string): boolean {
  const router = useRouter();
  const status = usePhoneStatus();
  const viewed = useRef(false);
  const alreadyVerified = status.state === "ready" && status.status.verified;
  useEffect(() => {
    if (alreadyVerified) router.replace(next);
  }, [alreadyVerified, next, router]);
  useEffect(() => {
    if (status.state === "loading" || alreadyVerified || viewed.current) return;
    viewed.current = true;
    track("phone_verify_viewed");
  }, [status.state, alreadyVerified]);
  return status.state === "loading" || alreadyVerified;
}

"use client";
/** Fires `signup_completed` once when the dashboard opens with `?welcome=1`, then removes the flag from the URL. */
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/shared/analytics";
import { useRouter } from "@/shared/i18n";

/**
 * Renders nothing; on the first load after sign-up it records the event and shows the welcome toast.
 * The flag is removed from the URL, so a reload does not count again. No email or user id is sent.
 *
 * @returns Nothing visible.
 */
export function WelcomeTracker(): null {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const t = useTranslations("auth");
  const done = useRef(false);
  const welcome = params.get("welcome") === "1";
  const method = params.get("method") === "google" ? "google" : "email";
  useEffect(() => {
    if (!welcome || done.current) return;
    done.current = true;
    track("signup_completed", { method });
    showToast({ title: t("welcome"), tone: "success" });
    router.replace("/dashboard");
  }, [welcome, method, router, showToast, t]);
  return null;
}

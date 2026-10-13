"use client";
/** Shows the "your account was deleted" toast once on the home page when the settings screen sent the flag, then removes the flag from the address. */
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { hasAccountDeletedFlag, withoutAccountDeletedFlag } from "../model/account-deleted";

/**
 * Reads the flag from the address on arrival; renders nothing.
 *
 * @returns Nothing.
 */
export function AccountDeletedNotice(): null {
  const t = useTranslations("home");
  const { showToast } = useToast();
  useEffect(() => {
    if (!hasAccountDeletedFlag(globalThis.location.search)) return;
    showToast({ title: t("accountDeleted"), tone: "success" });
    globalThis.history.replaceState(null, "", withoutAccountDeletedFlag(globalThis.location.href));
  }, [showToast, t]);
  return null;
}

"use client";
/** Shows the "your account was deleted" toast once on the home page when the settings screen sent the flag, then removes the flag from the address. */
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ACCOUNT_DELETED_PARAM, hasAccountDeletedFlag } from "../model/account-deleted";

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
    const url = new URL(globalThis.location.href);
    url.searchParams.delete(ACCOUNT_DELETED_PARAM);
    globalThis.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [showToast, t]);
  return null;
}

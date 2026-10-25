"use client";
/** Banner above the report when the server refused a save that the preview had passed (422 PATTERN_INVALID). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/**
 * Renders the "the server found a problem" banner.
 *
 * @returns The banner.
 */
export function ServerRejectedNotice(): ReactElement {
  const t = useTranslations("patternPage.rejected");
  return (
    <div role="alert" className="rounded-md border border-danger p-3" data-testid="server-rejected">
      <p className="font-semibold text-danger">{t("title")}</p>
      <p className="text-sm text-text">{t("body")}</p>
    </div>
  );
}

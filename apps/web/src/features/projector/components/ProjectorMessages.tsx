"use client";
/** The text states over the black canvas: loading the pattern, or a failure with a way out (issue #286). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import { LINK_BUTTON } from "./link-button";

/**
 * Renders the loading line or the failure.
 *
 * @param props - What to show.
 * @param props.failed - True when the version or the draft failed.
 * @param props.exitHref - Where "Exit" goes.
 * @returns The message.
 */
export function ProjectorMessage({
  failed,
  exitHref,
}: Readonly<{ failed: boolean; exitHref: string }>): ReactElement {
  const t = useTranslations("projector.view");
  if (!failed) {
    return (
      <p role="status" className="absolute inset-x-0 top-1/2 text-center">
        {t("loading")}
      </p>
    );
  }
  return (
    <div role="alert" className="absolute inset-x-0 top-1/2 flex flex-col items-center gap-3">
      <p>{t("failed")}</p>
      <Link href={exitHref} className={`${LINK_BUTTON} bg-surface text-text`}>
        {t("exit")}
      </Link>
    </div>
  );
}

"use client";
/** The link from the design editor to the pattern page. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/**
 * Renders "View pattern" for a design, keeping the client in the URL.
 *
 * @param props - Component props.
 * @param props.designId - The design.
 * @param props.clientId - The client from the editor URL, if any.
 * @returns The link.
 */
export function PatternLink({
  designId,
  clientId,
}: Readonly<{ designId: string; clientId?: string }>): ReactElement {
  const t = useTranslations("patternPage");
  const query = clientId === undefined ? "" : `?clientId=${clientId}`;
  return (
    <Link
      href={`/designs/${designId}/pattern${query}`}
      className="inline-flex min-h-11 items-center self-start rounded-md bg-primary px-4 font-semibold text-on-primary"
      data-testid="view-pattern"
    >
      {t("viewPattern")}
    </Link>
  );
}

/** The top of the confirmation: the garment type with its confidence, the AI hint and the "check every feature" banner (FR-DES-04). */
import type { DesignAnalysisResult, GarmentCategory } from "@tafsila/schemas";
import { Badge } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { isWeakOverall } from "../model/confidence";
import { ConfidenceBadge } from "./ConfidenceBadge";

/** Props for {@link SummaryHeader}. */
interface SummaryHeaderProps {
  /** The analysis. */
  readonly result: DesignAnalysisResult;
  /** The garment type now (the analysis wins over the one chosen at the start). */
  readonly category: GarmentCategory;
}

/**
 * Renders the summary and, when most features are low, the banner.
 *
 * @param props - The analysis and the category.
 * @returns The header.
 */
export function SummaryHeader({ result, category }: Readonly<SummaryHeaderProps>): ReactElement {
  const t = useTranslations("confirmDesign");
  const picker = useTranslations("designPicker");
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="info">{picker(`category.${category}`)}</Badge>
        <ConfidenceBadge value={result.category.confidence} />
        <p className="m-0 text-sm text-muted">{t("aiHint")}</p>
      </div>
      {isWeakOverall(result) ? (
        <p role="alert" className="m-0 rounded-md border border-warning bg-accent-soft px-3.5 py-2.5">
          {t("weak")}
        </p>
      ) : null}
    </>
  );
}

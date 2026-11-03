/** The confidence tag of a feature: level word and percent, never colour alone (FR-DES-04). */
import { Badge, type BadgeTone } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { levelOf, percentOf, type ConfidenceLevel } from "../model/confidence";

/** Badge tone per level. */
const TONE: Record<ConfidenceLevel, BadgeTone> = { high: "success", medium: "neutral", low: "danger" };

/** Props for {@link ConfidenceBadge}. */
interface ConfidenceBadgeProps {
  /** Confidence from 0 to 1. */
  readonly value: number;
}

/**
 * Renders "High 96%" and its colour.
 *
 * @param props - The confidence.
 * @returns The badge.
 */
export function ConfidenceBadge({ value }: Readonly<ConfidenceBadgeProps>): ReactElement {
  const t = useTranslations("confirmDesign.level");
  const level = levelOf(value);
  return (
    <Badge tone={TONE[level]} data-level={level}>
      {t(level)} · {percentOf(value)}%
    </Badge>
  );
}

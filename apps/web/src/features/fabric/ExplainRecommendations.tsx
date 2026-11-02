"use client";
/** The "Why these fabrics?" block of the recommendation panel: asks the API for the AI explanation on demand (FR-REC-04). */
import { useLocale } from "next-intl";
import type { ReactElement } from "react";
import { useFabricExplanation, type FabricExplanationState } from "./hooks/use-fabric-explanation";
import { ExplainView, type ExplainViewProps } from "./components/ExplainView";

/** Props of {@link ExplainRecommendations}. */
interface ExplainRecommendationsProps {
  /** Saved version whose recommendation is explained. */
  readonly versionId: string;
}

/**
 * Which state of the block the explanation is in.
 *
 * @param state - The explanation state.
 * @returns The block state.
 */
function statusOf(state: FabricExplanationState): ExplainViewProps["status"] {
  if (state.explanation) return "ready";
  if (state.error) return "failed";
  return state.asked ? "loading" : "idle";
}

/**
 * Loads and shows the explanation of one version in the page language.
 *
 * @param props - The version id.
 * @returns The block.
 */
export function ExplainRecommendations({ versionId }: Readonly<ExplainRecommendationsProps>): ReactElement {
  const locale = useLocale() as "ar" | "en";
  const state = useFabricExplanation(versionId, locale);
  const status = statusOf(state);
  return (
    <ExplainView status={status} text={state.explanation?.text} onAsk={state.ask} onRetry={state.retry} />
  );
}

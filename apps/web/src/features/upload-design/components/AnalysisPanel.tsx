/** The analysing panel: heading, steps, the note of the phase and the actions that fit it (FR-DES-02). */
import { Button, Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { AnalysisPhase } from "../model/analysis-view";
import { AnalysisSteps } from "./AnalysisSteps";

/** Props for {@link AnalysisPanel}. */
interface AnalysisPanelProps {
  readonly phase: AnalysisPhase;
  /** Design id, for the links. */
  readonly designId: string;
  readonly retrying: boolean;
  readonly onRetry: () => void;
}

/** Message key of the note under the steps, per phase. */
const NOTE_KEY: Record<AnalysisPhase, "usually" | "slow" | "notCounted" | "doneHint"> = {
  running: "usually",
  slow: "slow",
  failed: "notCounted",
  done: "doneHint",
};

/**
 * Renders the card and the actions of a phase.
 *
 * @param props - The phase, the design id and the retry handler.
 * @returns The panel.
 */
export function AnalysisPanel({
  phase,
  designId,
  retrying,
  onRetry,
}: Readonly<AnalysisPanelProps>): ReactElement {
  const t = useTranslations("uploadDesign.analysing");
  const failed = phase === "failed";
  const done = phase === "done";
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3.5 rounded-lg bg-surface p-5 shadow-card">
        <h2 className="m-0 text-xl font-semibold">{done ? t("done") : t("heading")}</h2>
        {failed ? (
          <div
            role="alert"
            className="rounded-md border border-danger bg-accent-soft px-3.5 py-2.5 text-base"
          >
            {t("failed")}
          </div>
        ) : null}
        <AnalysisSteps phase={phase} />
        <p role="status" className="m-0 text-sm text-muted">
          {t(NOTE_KEY[phase])}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {failed ? (
          <Button onClick={onRetry} disabled={retrying}>
            {t("retry")}
          </Button>
        ) : null}
        {done ? (
          <UiLink asChild>
            <Link href={`/designs/${designId}`}>{t("doneAction")}</Link>
          </UiLink>
        ) : null}
        {failed || phase === "slow" ? (
          <UiLink asChild>
            <Link href="/designs/new">{t("manual")}</Link>
          </UiLink>
        ) : null}
        {phase === "running" || phase === "slow" ? (
          <UiLink asChild>
            <Link href="/designs/new/photos">{t("cancel")}</Link>
          </UiLink>
        ) : null}
      </div>
    </section>
  );
}

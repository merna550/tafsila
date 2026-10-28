"use client";
/** The fabric calculator of a saved version: options, lengths per fabric kind, warnings and the marker diagram (FR-FAB-01 to FR-FAB-05, issue #318). */
import { Card } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { layoutHref } from "@/features/projector";
import { DataState } from "@/shared/data-state";
import type { FabricKind } from "@/shared/fabric-nesting";
import { CalcResultsPanel } from "./components/CalcResultsPanel";
import { FabricOptionsForm } from "./components/FabricOptionsForm";
import { NestingProgress } from "./components/NestingProgress";
import { useFabricCalculator } from "./hooks/use-fabric-calculator";

/** Props of {@link FabricCalculator}. */
interface FabricCalculatorProps {
  /** The saved version to calculate for. */
  readonly versionId: string;
  /** The design the version belongs to, for the projector link. */
  readonly designId: string;
}

/**
 * Renders the calculator. It opens with the saved result and options, if any, and calculates only when asked.
 *
 * @param props - The design and version ids.
 * @returns The section.
 */
export function FabricCalculator({ versionId, designId }: Readonly<FabricCalculatorProps>): ReactElement {
  const t = useTranslations("fabric.calc");
  const model = useFabricCalculator(versionId);
  const [kind, setKind] = useState<FabricKind>("main");
  const { state } = model.nesting;
  const running = state.status === "running";
  return (
    <section aria-labelledby="fabric-calc-title" className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <h2 id="fabric-calc-title" className="text-xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted">{t("subtitle")}</p>
      </div>
      <DataState
        isPending={model.version.isPending}
        error={model.version.error}
        isEmpty={false}
        onRetry={() => void model.version.refetch()}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <FabricOptionsForm
              values={model.values}
              errors={model.errors}
              busy={running || model.loadingSaved}
              hasResult={model.view !== null}
              onChange={model.change}
              onSubmit={model.submit}
            />
          </Card>
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
            {running ? (
              <Card>
                <NestingProgress
                  stage={state.progress?.stage ?? null}
                  slow={model.slow}
                  onCancel={model.nesting.cancel}
                />
              </Card>
            ) : null}
            {!running && model.view ? (
              <CalcResultsPanel
                view={model.view}
                kind={kind}
                onKindChange={setKind}
                onTryOpen={model.tryOpen}
                projectHref={(k) => layoutHref(designId, versionId, k)}
              />
            ) : null}
            {!running && !model.view ? <p className="text-muted">{t("results.empty")}</p> : null}
          </div>
        </div>
      </DataState>
    </section>
  );
}

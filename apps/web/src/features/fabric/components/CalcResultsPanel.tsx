/** Everything shown once a calculation exists: the warning, the older-version note, the lengths and the marker diagram. */
import { NESTING_VERSION } from "@tafsila/nesting/version";
import { Card, SegmentedControl } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { FabricKind } from "@/shared/fabric-nesting";
import type { CalcView } from "../model/calc-view";
import { isOlderNestingVersion } from "../model/format";
import { DoesNotFitNotice } from "./DoesNotFitNotice";
import { FabricResults } from "./FabricResults";
import { MarkerDiagram } from "./MarkerDiagram";

/** Props of {@link CalcResultsPanel}. */
interface CalcResultsPanelProps {
  /** The calculation to show. */
  readonly view: CalcView;
  /** The fabric kind whose diagram is drawn. */
  readonly kind: FabricKind;
  /** Called when the user picks another kind. */
  readonly onKindChange: (kind: FabricKind) => void;
  /** Called by "Try the open layout". */
  readonly onTryOpen: () => void;
  /** Builds the projector link of a fabric kind (FR-FAB-04). */
  readonly projectHref?: (kind: FabricKind) => string;
}

/**
 * Renders the results of one calculation.
 *
 * @param props - The view, the drawn kind and the handlers.
 * @returns The panel.
 */
export function CalcResultsPanel({
  view,
  kind,
  onKindChange,
  onTryOpen,
  projectHref,
}: Readonly<CalcResultsPanelProps>): ReactElement {
  const t = useTranslations("fabric.calc");
  const shown = view.kinds.find((k) => k.kind === kind) ?? view.kinds[0];
  const blocked = view.doesNotFit.length > 0;
  return (
    <>
      {blocked ? (
        <DoesNotFitNotice
          items={view.doesNotFit}
          canTryOpen={view.options.layout === "folded" && view.suggestOpen}
          onTryOpen={onTryOpen}
        />
      ) : null}
      {isOlderNestingVersion(view.nestingVersion, NESTING_VERSION) ? (
        <p role="status" className="text-sm text-muted">
          {t("saved.olderVersion")}
        </p>
      ) : null}
      <Card>
        <FabricResults view={view} blocked={blocked} projectHref={projectHref} />
      </Card>
      <Card title={t("marker.title")}>
        {view.kinds.length > 1 ? (
          <SegmentedControl
            label={t("marker.kindGroup")}
            value={shown?.kind ?? "main"}
            options={view.kinds.map((k) => ({ value: k.kind, label: t(`results.kind.${k.kind}`) }))}
            onChange={onKindChange}
          />
        ) : null}
        {shown?.scene ? (
          <MarkerDiagram scene={shown.scene} />
        ) : (
          <p className="text-muted">{t("marker.notDrawn")}</p>
        )}
      </Card>
    </>
  );
}

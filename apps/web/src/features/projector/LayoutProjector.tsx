"use client";
/** The projector in layout mode: the marker of one fabric kind at 1:1, no rotation, the kind label instead of the piece list (issue #321, FR-FAB-04). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { FabricKind } from "@/shared/fabric-nesting";
import { LINK_BUTTON } from "./components/link-button";
import { ProjectorFrame } from "./ProjectorFrame";
import { useCalibrationGuard } from "./hooks/use-calibration-guard";
import { useLayoutScene } from "./hooks/use-layout-scene";
import { useLayoutView } from "./hooks/use-layout-view";
import { useProjectorPieces } from "./hooks/use-projector-pieces";
import { useProjectorView } from "./hooks/use-projector-view";
import { layoutPieces, layoutQuery } from "./model/projector-mode";

/** Props of {@link LayoutProjector}. */
interface LayoutProjectorProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** Version id from the URL. */
  readonly versionId: string;
  /** The fabric kind to project. */
  readonly kind: FabricKind;
}

/**
 * Renders the marker projector.
 *
 * @param props - Ids and the fabric kind.
 * @returns The screen.
 */
export function LayoutProjector({ designId, versionId, kind }: Readonly<LayoutProjectorProps>): ReactElement {
  const t = useTranslations("projector.layout");
  const versionHref = `/designs/${designId}/versions/${versionId}`;
  const calibration = useCalibrationGuard(`${versionHref}/projector/calibrate${layoutQuery(kind)}`);
  const source = useLayoutScene(versionId, kind);
  const base = useProjectorView();
  const { projector, toStart } = useLayoutView(source.scene, calibration, base);
  const pieces = layoutPieces(
    useProjectorPieces(`${versionId}:layout:${kind}`, source.scene, projector),
    toStart,
  );
  return (
    <ProjectorFrame
      designId={designId}
      versionId={versionId}
      calibration={calibration}
      version={source.version}
      scene={source.scene}
      failure={source.failure}
      loading={source.loading}
      projector={projector}
      pieces={pieces}
      layout={kind}
      loadingText={t("loading")}
      notice={
        source.needsCalc ? (
          <div role="status" className="absolute inset-x-0 top-1/2 flex flex-col items-center gap-3">
            <p>{t("needsCalc")}</p>
            <Link href={versionHref} className={`${LINK_BUTTON} bg-surface text-text`}>
              {t("goCalculate")}
            </Link>
          </div>
        ) : null
      }
      panel={
        <section
          data-testid="layout-label"
          className="flex flex-col gap-2 rounded-lg border border-muted bg-text/90 p-3"
        >
          <h2 className="text-sm font-semibold">
            {t("label", { kind: t(`kind.${kind}`), length: source.lengthM?.toFixed(1) ?? "" })}
          </h2>
          <Button variant="secondary" aria-keyshortcuts="0" onClick={toStart}>
            {t("backToStart")}
          </Button>
        </section>
      }
    />
  );
}

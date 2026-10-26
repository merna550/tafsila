"use client";
/** The loaded direct-cut screen: header, the chosen piece's workspace (or its loading and error states), the print view and the clear dialog. */
import { ErrorState, Skeleton } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import type { DirectCut } from "../model/types";
import { ClearTicksDialog } from "./ClearTicksDialog";
import { DirectCutHeader } from "./DirectCutHeader";
import { PieceWorkspace } from "./PieceWorkspace";
import { PrintView } from "./PrintView";

/** Props of {@link DirectCutBody}. */
interface DirectCutBodyProps {
  /** The screen data. */
  readonly data: DirectCut;
  /** The version page. */
  readonly versionHref: string;
}

/**
 * Renders the steps area: the error, the workspace or the skeleton.
 *
 * @param props - The screen data.
 * @param props.data - The screen data.
 * @returns The area.
 */
function StepsArea({ data }: Readonly<{ data: DirectCut }>): ReactElement {
  const t = useTranslations("directCut");
  const { steps, piece } = data;
  if (steps.status === "error") {
    return <ErrorState title={t("error")} onRetry={steps.retry} retryLabel={t("retry")} />;
  }
  if (steps.plan && piece) {
    return (
      <PieceWorkspace
        plan={steps.plan}
        piece={piece}
        ticks={data.ticks}
        settings={data.settings}
        onChoosePiece={data.choosePiece}
      />
    );
  }
  return (
    <div className="flex flex-col gap-2" role="status" aria-label={t("loading")}>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

/**
 * Renders the screen once the version has loaded.
 *
 * @param props - The data and the way back.
 * @returns The body, or nothing before the version arrives.
 */
export function DirectCutBody({ data, versionHref }: Readonly<DirectCutBodyProps>): ReactElement | null {
  const [clearing, setClearing] = useState(false);
  const { detail, steps, printView } = data;
  if (detail === undefined) return null;
  const { version } = detail;
  const title = data.title ?? "";
  return (
    <>
      <div
        className={printView ? "hidden" : "flex flex-col gap-4 print:hidden"}
        data-testid="direct-cut-screen"
      >
        <DirectCutHeader
          title={title}
          versionNo={version.versionNo}
          engineVersion={steps.plan?.engineVersion ?? version.engineVersion}
          engineChanged={detail.engineChanged}
          pieceName={data.piece?.name}
          ready={steps.plan !== undefined}
          versionHref={versionHref}
          onPrintView={() => data.setPrintView(true)}
          onClear={() => setClearing(true)}
        />
        <StepsArea data={data} />
      </div>
      {steps.plan ? (
        <PrintView
          plan={steps.plan}
          title={title}
          versionNo={version.versionNo}
          sizeLabel={version.sizeLabel ?? "-"}
          open={printView}
          onBack={() => data.setPrintView(false)}
        />
      ) : null}
      <ClearTicksDialog
        open={clearing}
        onClose={() => setClearing(false)}
        onConfirm={() => {
          data.ticks.clear();
          setClearing(false);
        }}
      />
    </>
  );
}

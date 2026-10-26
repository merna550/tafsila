"use client";
/** The print sheet with its toolbar: on screen after "Print view", always in the browser's print output. */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CutPlan } from "@/shared/pattern-preview";
import { PrintSheet } from "./PrintSheet";

/** Props of {@link PrintView}. */
interface PrintViewProps {
  /** The plan. */
  readonly plan: CutPlan;
  /** The design title. */
  readonly title: string;
  /** Version number. */
  readonly versionNo: number;
  /** Size label of the version. */
  readonly sizeLabel: string;
  /** True while the print view is open on screen. */
  readonly open: boolean;
  /** Closes the print view. */
  readonly onBack: () => void;
}

/**
 * Renders the sheet; the toolbar is never printed.
 *
 * @param props - The plan, the title block data and the view state.
 * @returns The print view.
 */
export function PrintView({
  plan,
  title,
  versionNo,
  sizeLabel,
  open,
  onBack,
}: Readonly<PrintViewProps>): ReactElement {
  const t = useTranslations("directCut.print");
  return (
    <div className={open ? "flex flex-col gap-4" : "hidden print:block"}>
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} data-testid="print-now">
            {t("print")}
          </Button>
          <Button variant="secondary" onClick={onBack}>
            {t("back")}
          </Button>
        </div>
      </div>
      <PrintSheet plan={plan} title={title} versionNo={versionNo} sizeLabel={sizeLabel} />
    </div>
  );
}

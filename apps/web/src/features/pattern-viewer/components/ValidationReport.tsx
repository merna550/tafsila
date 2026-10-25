"use client";
/** The validation report beside the pattern: overall status, failures, warnings and collapsed passes (issue #249, FR-VAL-09). */
import type { ValidationReport as Report } from "@tafsila/schemas";
import { Badge } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { reportRows, type ReportRow as RowModel } from "../model/report-rows";
import type { PatternScene, ViewerTarget } from "../model/types";
import { ReportRow } from "./ReportRow";

/** Props of {@link ValidationReport}. */
interface ValidationReportProps {
  /** The engine's report. */
  readonly report: Report;
  /** The scene the report's refs point into. */
  readonly scene: PatternScene;
  /** Key of the row that is selected, or null. */
  readonly selectedKey: string | null;
  /** Called with the chosen row's key and targets, or `null` and `[]` when the row is chosen again. */
  readonly onSelect: (key: string | null, targets: readonly ViewerTarget[]) => void;
}

/**
 * The panel only reports what was chosen; the page sets the highlight and zooms (decision 249).
 *
 * @param props - Component props.
 * @returns The panel.
 */
export function ValidationReport({
  report,
  scene,
  selectedKey,
  onSelect,
}: Readonly<ValidationReportProps>): ReactElement {
  const t = useTranslations("patternViewer.report");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const rows = reportRows(report, scene);
  /**
   * Renders one row; choosing the selected row again clears the selection.
   *
   * @param row - The row.
   * @returns The list item.
   */
  const item = (row: RowModel): ReactElement => (
    <li key={row.key}>
      <ReportRow
        row={row}
        locale={locale}
        selected={selectedKey === row.key}
        onSelect={() => (selectedKey === row.key ? onSelect(null, []) : onSelect(row.key, row.targets))}
      />
    </li>
  );
  const attention = [...rows.failures, ...rows.warnings];
  return (
    <section
      aria-labelledby="validation-report-title"
      className="flex flex-col gap-3"
      data-testid="validation-report"
    >
      <h3 id="validation-report-title" className="text-lg font-semibold">
        {t("title")}
      </h3>
      <div role="status" className="flex flex-wrap items-center gap-2" data-status={report.status}>
        <span className="sr-only">{t(`overall.${report.status}`)}. </span>
        {rows.failures.length > 0 ? (
          <Badge tone="danger">{t("failCount", { count: rows.failures.length })}</Badge>
        ) : null}
        {rows.warnings.length > 0 ? (
          <Badge tone="warning">{t("warnCount", { count: rows.warnings.length })}</Badge>
        ) : null}
        <Badge tone="success">{t("passCount", { count: rows.passes.length })}</Badge>
      </div>
      {attention.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">{attention.map(item)}</ul>
      ) : null}
      {rows.passes.length > 0 ? (
        <details data-testid="report-passes">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
            {t("passedSummary", { count: rows.passes.length })}
          </summary>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">{rows.passes.map(item)}</ul>
        </details>
      ) : null}
    </section>
  );
}

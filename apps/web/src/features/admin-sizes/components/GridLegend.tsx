/** Legend under the grid (changed cell) and the list of problems that block saving, plus warnings. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { MeasurementField } from "@/features/measurements/model";
import type { GridProblem, GridVerdict } from "../model/size-grid";

/** Props for {@link GridLegend}. */
interface GridLegendProps {
  /** The judgement of the grid. */
  readonly verdict: GridVerdict;
}

/**
 * Describes one problem as a sentence.
 *
 * @param entry - The problem.
 * @param fieldLabel - Translates a measurement to its label.
 * @param unreadable - Translates the reason a cell cannot be read.
 * @returns The sentence, with the size first.
 */
function describe(
  entry: GridProblem,
  fieldLabel: (field: MeasurementField) => string,
  unreadable: (error: string) => string,
): string {
  const where = entry.field ? `${entry.size}: ${fieldLabel(entry.field)}. ` : `${entry.size}: `;
  return entry.problem.kind === "engine"
    ? `${where}${entry.problem.text}`
    : `${where}${unreadable(entry.problem.error)}`;
}

/**
 * Renders the legend, the error list (announced to screen readers) and the warnings.
 *
 * @param props - The verdict.
 * @returns The legend block.
 */
export function GridLegend({ verdict }: Readonly<GridLegendProps>): ReactElement {
  const t = useTranslations("admin.sizes");
  const labels = useTranslations("measurements");
  const errors = useTranslations("measurements.errors");
  return (
    <div className="flex flex-col gap-3 text-base">
      <div className="flex flex-wrap gap-4">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-4 rounded-sm border border-accent bg-accent-soft" />
          {t("legend.dirty")}
        </span>
        <span className="flex items-center gap-2 text-danger">
          <span aria-hidden="true" className="size-4 rounded-sm border-2 border-danger" />
          {t("legend.invalid")}
        </span>
      </div>
      {verdict.problems.length > 0 ? (
        <ul role="status" aria-label={t("problems.label")} className="m-0 list-none p-0 text-danger">
          {verdict.problems.map((entry, index) => (
            <li key={`${entry.size}-${entry.field ?? "size"}-${index}`}>
              {describe(
                entry,
                (field) => labels(`labels.${field}`),
                (error) => errors(error as "required" | "notANumber" | "tooManyDecimals"),
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {verdict.warnings.length > 0 ? (
        <div className="text-warning">
          <p className="m-0 font-semibold">{t("problems.warnings", { count: verdict.warnings.length })}</p>
          <ul className="m-0 list-none p-0">
            {verdict.warnings.map((warning, index) => (
              <li key={`${warning.size}-${warning.code}-${index}`}>{`${warning.size}: ${warning.text}`}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** The editable size grid: one row per measurement (grouped like the measurement form), one column per size, cells in cm. */
import { Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { Fragment, type ReactElement } from "react";
import { FIELD_GROUPS, type MeasurementField } from "@/features/measurements/model";
import { cellKey, type GridTexts, type GridVerdict } from "../model/size-grid";

/** Props for {@link SizeGrid}. */
interface SizeGridProps {
  /** Texts of all cells. */
  readonly texts: GridTexts;
  /** Which cells changed or are wrong. */
  readonly verdict: GridVerdict;
  /** Called with every edit. */
  readonly onEdit: (size: string, field: MeasurementField, value: string) => void;
}

/**
 * Picks the look of a cell: wrong beats changed beats normal. A wrong cell also carries `aria-invalid`.
 *
 * @param invalid - True when the cell has a problem.
 * @param dirty - True when the cell changed.
 * @returns Classes for the input.
 */
function cellClasses(invalid: boolean, dirty: boolean): string {
  if (invalid) return "border-2 border-danger";
  return dirty ? "border-accent bg-accent-soft" : "border-line";
}

/** Props for {@link SizeGridRow}. */
interface SizeGridRowProps extends SizeGridProps {
  /** The measurement of this row. */
  readonly field: MeasurementField;
}

/**
 * Renders one measurement: its label as the row header and one input per size.
 *
 * @param props - The measurement, texts, verdict and the edit handler.
 * @returns The row.
 */
function SizeGridRow({ field, texts, verdict, onEdit }: Readonly<SizeGridRowProps>): ReactElement {
  const t = useTranslations("admin.sizes");
  const labels = useTranslations("measurements");
  return (
    <tr className="border-t border-line">
      <th scope="row" className="px-4 py-2 text-start font-medium">
        {labels(`labels.${field}`)}
      </th>
      {verdict.sizes.map((size) => {
        const key = cellKey(size, field);
        const invalid = verdict.invalid.has(key);
        const dirty = verdict.dirty.has(key);
        return (
          <td key={size} className="px-2 py-1.5 text-center">
            <Input
              dir="ltr"
              inputMode="decimal"
              autoComplete="off"
              aria-label={t("cellLabel", { field: labels(`labels.${field}`), size })}
              aria-invalid={invalid}
              data-dirty={dirty}
              value={texts[size]?.[field] ?? ""}
              onChange={(event) => onEdit(size, field, event.target.value)}
              className={`w-20 px-2 text-center ${cellClasses(invalid, dirty)}`}
            />
          </td>
        );
      })}
    </tr>
  );
}

/**
 * Renders the table. Cells are inputs labelled "measurement size", so each is findable by a screen reader.
 *
 * @param props - Texts, verdict and the edit handler.
 * @returns The grid.
 */
export function SizeGrid({ texts, verdict, onEdit }: Readonly<SizeGridProps>): ReactElement {
  const t = useTranslations("admin.sizes");
  const groups = useTranslations("measurements.groups");
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
      <table className="w-full min-w-160 border-collapse text-base text-text">
        <caption className="sr-only">{t("caption")}</caption>
        <thead className="bg-surface-hover">
          <tr>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              {t("measurement")}
            </th>
            {verdict.sizes.map((size) => (
              <th key={size} scope="col" className="px-2 py-3 text-center font-semibold">
                <span dir="ltr">{size}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FIELD_GROUPS.map((group) => (
            <Fragment key={group.id}>
              <tr className="border-t border-line bg-background">
                <th
                  scope="colgroup"
                  colSpan={verdict.sizes.length + 1}
                  className="px-4 py-2 text-start text-sm font-semibold text-muted"
                >
                  {groups(group.id)}
                </th>
              </tr>
              {group.fields.map((field) => (
                <SizeGridRow key={field} field={field} texts={texts} verdict={verdict} onEdit={onEdit} />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

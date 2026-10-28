/** The lengths to buy, one tile per fabric kind that has pieces (FR-FAB-05); metres with one decimal in Western digits. */
import { StatTile } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CalcView } from "../model/calc-view";
import { formatCm, formatMetres } from "../model/format";

/** Props of {@link FabricResults}. */
interface FabricResultsProps {
  /** The calculation to show. */
  readonly view: CalcView;
  /** True when pieces do not fit, so the lengths cannot be trusted. */
  readonly blocked: boolean;
}

/**
 * Renders the length tiles and the rounding note.
 *
 * @param props - The calculation and whether it is blocked.
 * @returns The results.
 */
export function FabricResults({ view, blocked }: Readonly<FabricResultsProps>): ReactElement {
  const t = useTranslations("fabric.calc.results");
  const detail = t(`detail.${view.options.layout}`, { width: formatCm(view.options.widthMm) });
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xl font-semibold">{t("title")}</h3>
      <dl className="m-0 grid gap-3 sm:grid-cols-3">
        {view.kinds.map((line) => (
          <div key={line.kind} data-testid={`fabric-length-${line.kind}`}>
            <StatTile
              label={t(`kind.${line.kind}`)}
              value={
                blocked || line.lengthM === 0 ? t("none") : t("metres", { value: formatMetres(line.lengthM) })
              }
            />
            <p className="mt-1 text-sm text-muted">{blocked ? t("blocked") : detail}</p>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">{t("rounding", { shrinkage: view.options.shrinkagePercent })}</p>
    </div>
  );
}

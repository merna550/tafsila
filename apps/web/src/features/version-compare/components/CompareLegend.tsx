"use client";
/** The legend under the overlay: one swatch and one checkbox per version, which also show or hide that version (issue #345). */
import { Checkbox } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** One side of the legend. */
export interface LegendSide {
  /** Version number. */
  readonly versionNo: number;
  /** When it was saved, already formatted. */
  readonly date: string;
  /** Whether it is drawn. */
  readonly shown: boolean;
  /** Called with the new state. */
  readonly onChange: (shown: boolean) => void;
}

/** Props of {@link CompareLegend}. */
interface CompareLegendProps {
  /** The first version (solid line). */
  readonly a: LegendSide;
  /** The second version (dashed line). */
  readonly b: LegendSide;
}

/**
 * Renders the legend.
 *
 * @param props - The two sides.
 * @returns The legend.
 */
export function CompareLegend({ a, b }: Readonly<CompareLegendProps>): ReactElement {
  const t = useTranslations("compare.legend");
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label={t("title")} data-testid="compare-legend">
      {[
        { side: a, key: "a", line: "border-t-2 border-solid border-primary" },
        { side: b, key: "b", line: "border-t-2 border-dashed border-accent" },
      ].map(({ side, key, line }) => (
        <li key={key} className="flex min-h-11 items-center gap-3">
          <Checkbox
            id={`compare-show-${key}`}
            checked={side.shown}
            onCheckedChange={(v) => side.onChange(v === true)}
            aria-label={t("show", { n: side.versionNo })}
          />
          <label htmlFor={`compare-show-${key}`} className="flex items-center gap-2 text-base text-text">
            <span aria-hidden="true" className={`inline-block w-8 ${line}`} />
            {t("version", { n: side.versionNo })}
            <span className="text-sm text-muted">{side.date}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

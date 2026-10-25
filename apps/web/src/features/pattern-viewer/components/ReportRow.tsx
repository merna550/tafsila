"use client";
/** One check of the validation report: icon, status word, message and values; a button when it points at the pattern (issue #249). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { ReportRow as ReportRowModel } from "../model/report-rows";

/** Props of {@link ReportRow}. */
interface ReportRowProps {
  /** The row. */
  readonly row: ReportRowModel;
  /** The message language. */
  readonly locale: "ar" | "en";
  /** Whether its refs are highlighted now. */
  readonly selected: boolean;
  /** Called when the row is chosen. */
  readonly onSelect: () => void;
}

/** Icon per status; decorative, the status word carries the meaning. */
const ICONS = { pass: "✅", warn: "⚠️", fail: "❌" } as const;

/** Row look per status; the border and fill only reinforce the icon and word. */
const TONES = {
  pass: "border-line bg-surface",
  warn: "border-line bg-surface",
  fail: "border-2 border-accent bg-accent-soft",
} as const;

/**
 * The measured and expected values in cm, when the check has them.
 *
 * @param props - Component props.
 * @param props.row - The row.
 * @returns The line, or nothing.
 */
function RowValues({ row }: Readonly<{ row: ReportRowModel }>): ReactElement | null {
  const t = useTranslations("patternViewer.report");
  const { measuredCm, expectedCm } = row;
  if (measuredCm === undefined && expectedCm === undefined) return null;
  return (
    <span className="mt-1 block text-sm text-muted" data-testid="report-values">
      {measuredCm === undefined ? null : t("measured", { value: measuredCm })}
      {measuredCm !== undefined && expectedCm !== undefined ? " · " : null}
      {expectedCm === undefined ? null : t("expected", { value: expectedCm })}
    </span>
  );
}

/**
 * Tells the person that the place is shaded on the pattern.
 *
 * @returns The note.
 */
function HighlightNote(): ReactElement {
  const t = useTranslations("patternViewer.report");
  return (
    <span className="mt-2 flex items-center gap-2 text-sm font-semibold text-accent">
      <span aria-hidden="true" className="h-1 w-5 rounded-sm bg-accent" />
      {t("highlighted")}
    </span>
  );
}

/**
 * A check row. The status word is read by screen readers before the message.
 *
 * @param props - Component props.
 * @returns A button when the row has targets, otherwise a plain block.
 */
export function ReportRow({ row, locale, selected, onSelect }: Readonly<ReportRowProps>): ReactElement {
  const t = useTranslations("patternViewer.report");
  const { check } = row;
  const body = (
    <>
      <span aria-hidden="true" className="flex-none text-lg leading-6">
        {ICONS[check.status]}
      </span>
      <span className="flex-1 text-start text-base leading-6">
        <span className="sr-only">{t(`status.${check.status}`)}: </span>
        <span className={check.status === "fail" ? "font-semibold" : "font-medium"}>
          {check.message[locale]}
        </span>
        <RowValues row={row} />
        {selected ? <HighlightNote /> : null}
      </span>
    </>
  );
  const classes = `flex w-full min-h-11 items-start gap-2.5 rounded-md border px-3 py-2.5 text-text ${
    selected ? TONES.fail : TONES[check.status]
  }`;
  return row.targets.length > 0 ? (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`${classes} cursor-pointer hover:bg-surface-hover`}
      data-testid={`report-row-${row.key}`}
      data-status={check.status}
    >
      {body}
    </button>
  ) : (
    <div className={classes} data-testid={`report-row-${row.key}`} data-status={check.status}>
      {body}
    </div>
  );
}

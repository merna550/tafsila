"use client";
/** Keyboard and screen-reader way to measure: choose the start and the end point from lists (issue #253, FR-VIEW-03). */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { PatternScene, SnapPoint, ViewerMeasure } from "../model/types";

/** Props of {@link MeasurePointList}. */
interface MeasurePointListProps {
  /** The pattern, for piece names. */
  readonly scene: PatternScene;
  /** The tool state. */
  readonly measure: ViewerMeasure;
  /** Replaces the tool state. */
  readonly onChange: (measure: ViewerMeasure) => void;
}

/** Props of {@link PointSelect}. */
interface PointSelectProps {
  /** Visible label. */
  readonly label: string;
  /** Test id. */
  readonly testId: string;
  /** The picked point, if any. */
  readonly value: SnapPoint | undefined;
  /** The pattern. */
  readonly scene: PatternScene;
  /** True until the start point is chosen. */
  readonly disabled?: boolean;
  /** Called with the chosen point id (empty for none). */
  readonly onPick: (id: string) => void;
}

/**
 * A select with the snap points of every piece, grouped by piece.
 *
 * @param props - Component props.
 * @returns The labelled select.
 */
function PointSelect({
  label,
  testId,
  value,
  scene,
  disabled,
  onPick,
}: Readonly<PointSelectProps>): ReactElement {
  const t = useTranslations("patternViewer.measure");
  const locale = useLocale() === "ar" ? "ar" : "en";
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <select
        data-testid={testId}
        value={value?.id ?? ""}
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
        className="min-h-11 rounded-md border border-border bg-surface px-2"
      >
        <option value="">{t("choose")}</option>
        {scene.pieces.map((piece) => (
          <optgroup key={piece.id} label={piece.name[locale]}>
            {piece.snapPoints.map((p, i) => (
              <option key={p.id} value={p.id}>
                {t(p.kind, { piece: piece.name[locale], index: i + 1 })}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

/**
 * Two selects, from and to; choosing both gives the same result as two taps on the drawing.
 *
 * @param props - Component props.
 * @returns The picker, or nothing while the tool is off.
 */
export function MeasurePointList({
  scene,
  measure,
  onChange,
}: Readonly<MeasurePointListProps>): ReactElement | null {
  const t = useTranslations("patternViewer.measure");
  if (!measure.active) return null;
  const all = scene.pieces.flatMap((p) => p.snapPoints);
  const [from, to] = measure.points;
  /**
   * Sets one end of the measurement.
   *
   * @param slot - 0 for the start, 1 for the end.
   * @param id - The chosen point id, or empty to clear.
   */
  function pick(slot: 0 | 1, id: string): void {
    const chosen = all.find((p) => p.id === id);
    const next: (SnapPoint | undefined)[] = [from, to];
    next[slot] = chosen;
    onChange({ active: true, points: next.filter((p): p is SnapPoint => p !== undefined) });
  }
  return (
    <div className="flex flex-wrap gap-3" data-testid="measure-point-list">
      <PointSelect
        label={t("from")}
        testId="measure-from"
        value={from}
        scene={scene}
        onPick={(id) => pick(0, id)}
      />
      <PointSelect
        label={t("to")}
        testId="measure-to"
        value={to}
        scene={scene}
        disabled={from === undefined}
        onPick={(id) => pick(1, id)}
      />
    </div>
  );
}

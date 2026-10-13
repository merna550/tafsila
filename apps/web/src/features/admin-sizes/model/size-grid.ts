/** Pure state of the size grid: what each cell shows, which cells changed, which are wrong and whether saving is allowed. */
import type { SizeChart } from "@tafsila/schemas";
import {
  ALL_FIELDS,
  parseCm,
  parseFields,
  toFieldTexts,
  type FieldError,
  type FieldTexts,
  type MeasurementField,
} from "@/features/measurements/model";
import { sortSizes } from "./size-order";
import { validateChart, type EngineProblem, type IssueLocale } from "./size-validation";

/** Typed text per size, then per measurement, in centimetres. */
export type GridTexts = Readonly<Record<string, FieldTexts>>;

/** Why one cell is wrong. */
export type CellProblem =
  | { readonly kind: "unreadable"; readonly error: FieldError }
  | { readonly kind: "engine"; readonly text: string };

/** One problem for the list under the grid. */
export interface GridProblem {
  /** Size label. */
  readonly size: string;
  /** The measurement, or null when the rule names none. */
  readonly field: MeasurementField | null;
  /** What is wrong. */
  readonly problem: CellProblem;
}

/** The judgement of the whole grid. */
export interface GridVerdict {
  /** Size labels in column order. */
  readonly sizes: readonly string[];
  /** Cells changed since the last saved chart, as "size:field" keys. */
  readonly dirty: ReadonlySet<string>;
  /** Cells with a problem, as "size:field" keys. */
  readonly invalid: ReadonlySet<string>;
  /** Problems for the list under the grid, in column order. */
  readonly problems: readonly GridProblem[];
  /** Warnings saved with the chart. */
  readonly warnings: readonly EngineProblem[];
  /** The complete chart in millimetres when every cell is readable. */
  readonly chart: SizeChart | undefined;
  /** True when something changed, nothing is wrong and every cell is readable. */
  readonly canSave: boolean;
}

/**
 * Builds the key of a cell.
 *
 * @param size - Size label.
 * @param field - Measurement.
 * @returns The key used in the dirty and invalid sets.
 */
export function cellKey(size: string, field: MeasurementField): string {
  return `${size}:${field}`;
}

/**
 * Writes a chart as the texts of its cells.
 *
 * @param chart - Chart in millimetres.
 * @returns One text per size and measurement, sizes in reading order.
 */
export function chartToTexts(chart: SizeChart): GridTexts {
  return Object.fromEntries(
    sortSizes(Object.keys(chart)).map((size) => [size, toFieldTexts(chart[size] ?? {})]),
  );
}

/**
 * Tells whether two cell texts mean the same value ("92" and "92.0" do).
 *
 * @param a - Text one.
 * @param b - Text two.
 * @returns True when they read to the same millimetres, or are the same text when one is unreadable.
 */
function sameCell(a: string, b: string): boolean {
  const first = parseCm(a);
  const second = parseCm(b);
  if (first.kind === "value" && second.kind === "value") return first.mm === second.mm;
  if (first.kind === "empty" && second.kind === "empty") return true;
  return a.trim() === b.trim();
}

/**
 * Collects the cells that cannot be read.
 *
 * @param sizes - Size labels.
 * @param texts - Current texts.
 * @returns Problems and the readable chart (undefined when any cell is unreadable).
 */
function readCells(
  sizes: readonly string[],
  texts: GridTexts,
): { problems: GridProblem[]; chart: SizeChart | undefined } {
  const problems: GridProblem[] = [];
  const chart: Record<string, NonNullable<ReturnType<typeof parseFields>["measurements"]>> = {};
  for (const size of sizes) {
    const parsed = parseFields(texts[size] as FieldTexts);
    for (const field of ALL_FIELDS) {
      const error = parsed.errors[field];
      if (error) problems.push({ size, field, problem: { kind: "unreadable", error } });
    }
    if (parsed.measurements) chart[size] = parsed.measurements;
  }
  return { problems, chart: problems.length === 0 ? chart : undefined };
}

/**
 * Finds the cells whose text differs from the saved chart.
 *
 * @param sizes - Size labels.
 * @param saved - Texts of the last saved chart.
 * @param current - Texts now.
 * @returns Cell keys.
 */
function dirtyCells(sizes: readonly string[], saved: GridTexts, current: GridTexts): Set<string> {
  const dirty = new Set<string>();
  for (const size of sizes) {
    for (const field of ALL_FIELDS) {
      if (!sameCell(saved[size]?.[field] ?? "", current[size]?.[field] ?? ""))
        dirty.add(cellKey(size, field));
    }
  }
  return dirty;
}

/**
 * Turns the engine's errors into problems; a rule that names no field is listed under its size only.
 *
 * @param errors - Engine errors.
 * @returns Problems for the list under the grid.
 */
function engineGridProblems(errors: readonly EngineProblem[]): GridProblem[] {
  return errors.flatMap((error) =>
    (error.fields.length > 0 ? error.fields : [null]).map((field) => ({
      size: error.size,
      field,
      problem: { kind: "engine", text: error.text } as const,
    })),
  );
}

/**
 * Judges the grid: which cells changed, which are wrong, and whether the chart can be saved.
 *
 * @param saved - Texts of the last saved chart.
 * @param current - Texts now.
 * @param locale - Language of the engine messages.
 * @returns The verdict.
 */
export function judgeGrid(saved: GridTexts, current: GridTexts, locale: IssueLocale): GridVerdict {
  const sizes = Object.keys(current);
  const dirty = dirtyCells(sizes, saved, current);
  const { problems, chart } = readCells(sizes, current);
  const report = chart ? validateChart(chart, locale) : { errors: [], warnings: [] };
  problems.push(...engineGridProblems(report.errors));
  const invalid = new Set(
    problems.flatMap((entry) => (entry.field ? [cellKey(entry.size, entry.field)] : [])),
  );
  return {
    sizes,
    dirty,
    invalid,
    problems,
    warnings: report.warnings,
    chart,
    canSave: dirty.size > 0 && problems.length === 0 && chart !== undefined,
  };
}

/**
 * Replaces one cell's text.
 *
 * @param texts - Current texts.
 * @param size - Size label.
 * @param field - Measurement.
 * @param value - New text.
 * @returns New texts.
 */
export function setCell(texts: GridTexts, size: string, field: MeasurementField, value: string): GridTexts {
  const row = texts[size];
  if (!row) return texts;
  return { ...texts, [size]: { ...row, [field]: value } };
}

/** CSV export and import of the size chart, no library. Format: `measurement,S,M,...` with camelCase measurement keys in cm. */
import { formatCm } from "@tafsila/utils";
import type { SizeChart } from "@tafsila/schemas";
import {
  ALL_FIELDS,
  isOptionalField,
  parseCm,
  type FieldError,
  type MeasurementField,
} from "@/features/measurements/model";
import { sortSizes } from "./size-order";
import { validateChart, type IssueLocale } from "./size-validation";

/** First header cell of the file. */
export const CSV_KEY_HEADER = "measurement";

/** Why part of a file cannot be used. */
export type CsvProblem =
  | { readonly kind: "empty" }
  | { readonly kind: "header" }
  | { readonly kind: "noSizes" }
  | { readonly kind: "duplicateSize"; readonly size: string }
  | { readonly kind: "unknownRow"; readonly line: number; readonly key: string }
  | { readonly kind: "duplicateRow"; readonly line: number; readonly key: string }
  | { readonly kind: "missingRow"; readonly field: MeasurementField }
  | {
      readonly kind: "cell";
      readonly line: number;
      readonly size: string;
      readonly field: MeasurementField;
      readonly error: FieldError;
    }
  | { readonly kind: "engine"; readonly size: string; readonly text: string };

/** Result of reading a file. */
export interface CsvImport {
  /** The chart, present only when the file has no problem. */
  readonly chart?: SizeChart;
  /** Size labels found in the header, in file order. */
  readonly sizes: readonly string[];
  /** Everything that must be fixed, in file order. */
  readonly problems: readonly CsvProblem[];
}

/**
 * Quotes a cell when it contains a comma, a quote or a line break.
 *
 * @param cell - Cell text.
 * @returns Text safe to join with commas.
 */
function quote(cell: string): string {
  return /[",\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
}

/**
 * Writes the chart as CSV (one row per measurement, one column per size, centimetres).
 *
 * @param chart - Chart in millimetres.
 * @returns The file text with `\r\n` line breaks.
 */
export function exportChartCsv(chart: SizeChart): string {
  const sizes = sortSizes(Object.keys(chart));
  const lines = [[CSV_KEY_HEADER, ...sizes].map(quote).join(",")];
  for (const field of ALL_FIELDS) {
    const cells = sizes.map((size) => {
      const mm = chart[size]?.[field];
      return typeof mm === "number" ? formatCm(mm) : "";
    });
    lines.push([field, ...cells].join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

/**
 * Picks the delimiter: a semicolon when the header has one and no comma (Excel with a decimal comma writes this).
 *
 * @param firstLine - First line of the file.
 * @returns "," or ";".
 */
function detectDelimiter(firstLine: string): "," | ";" {
  return firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
}

/** Reading state of the CSV splitter. */
interface SplitState {
  /** Finished rows. */
  rows: string[][];
  /** Cells of the row being read. */
  row: string[];
  /** Text of the cell being read. */
  cell: string;
  /** True between quotes. */
  quoted: boolean;
}

/**
 * Ends the cell being read.
 *
 * @param state - Splitter state (changed in place).
 */
function endCell(state: SplitState): void {
  state.row.push(state.cell);
  state.cell = "";
}

/**
 * Ends the row being read.
 *
 * @param state - Splitter state (changed in place).
 */
function endRow(state: SplitState): void {
  endCell(state);
  state.rows.push(state.row);
  state.row = [];
}

/**
 * Reads one character inside quotes: a doubled quote is a quote, a single one ends the quoted part.
 *
 * @param state - Splitter state (changed in place).
 * @param char - Current character.
 * @param next - The character after it.
 * @returns How many extra characters were used.
 */
function readQuoted(state: SplitState, char: string, next: string | undefined): number {
  if (char !== '"') {
    state.cell += char;
    return 0;
  }
  if (next === '"') {
    state.cell += '"';
    return 1;
  }
  state.quoted = false;
  return 0;
}

/**
 * Reads one character outside quotes.
 *
 * @param state - Splitter state (changed in place).
 * @param char - Current character.
 * @param next - The character after it.
 * @param delimiter - Cell delimiter.
 * @returns How many extra characters were used.
 */
function readPlain(state: SplitState, char: string, next: string | undefined, delimiter: string): number {
  if (char === '"') state.quoted = true;
  else if (char === delimiter) endCell(state);
  else if (char === "\n" || char === "\r") {
    endRow(state);
    return char === "\r" && next === "\n" ? 1 : 0;
  } else state.cell += char;
  return 0;
}

/** The byte order mark some editors put at the start of a file. */
// eslint-disable-next-line no-magic-numbers -- U+FEFF is the BOM code point
const BOM = String.fromCharCode(0xfeff);

/**
 * Splits CSV text into rows of cells: quotes, doubled quotes, line breaks inside quotes, `\r\n`, `\n` and a BOM.
 *
 * @param text - File text.
 * @returns Rows of cells.
 */
export function parseCsvRows(text: string): string[][] {
  const clean = text.startsWith(BOM) ? text.slice(1) : text;
  const delimiter = detectDelimiter(clean.split(/\r\n|\n|\r/, 1)[0] ?? "");
  const state: SplitState = { rows: [], row: [], cell: "", quoted: false };
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i] as string;
    const next = clean[i + 1];
    i += state.quoted ? readQuoted(state, char, next) : readPlain(state, char, next, delimiter);
  }
  if (state.cell !== "" || state.row.length > 0) endRow(state);
  return state.rows;
}

/**
 * Reads the header: the key cell and the size labels.
 *
 * @param header - Cells of the first row.
 * @returns Size labels and the problems of the header.
 */
function readHeader(header: readonly string[]): { sizes: string[]; problems: CsvProblem[] } {
  const problems: CsvProblem[] = [];
  if ((header[0] ?? "").trim().toLowerCase() !== CSV_KEY_HEADER) problems.push({ kind: "header" });
  const sizes: string[] = [];
  for (const raw of header.slice(1)) {
    const size = raw.trim();
    if (size === "") continue;
    if (sizes.includes(size)) problems.push({ kind: "duplicateSize", size });
    else sizes.push(size);
  }
  if (sizes.length === 0) problems.push({ kind: "noSizes" });
  return { sizes, problems };
}

/** Values read from the body, in millimetres per size and field. */
type BodyValues = Record<string, Partial<Record<MeasurementField, number>>>;

/**
 * Reads the body rows into values and problems.
 *
 * @param rows - All rows including the header.
 * @param lines - 1-based file line number of each row.
 * @param sizes - Size labels from the header.
 * @returns Values and problems.
 */
function readBody(
  rows: readonly string[][],
  lines: readonly number[],
  sizes: readonly string[],
): { values: BodyValues; problems: CsvProblem[] } {
  const problems: CsvProblem[] = [];
  const values: BodyValues = Object.fromEntries(sizes.map((size) => [size, {}]));
  const seen = new Set<string>();
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] as string[];
    const line = lines[index] as number;
    const key = (row[0] ?? "").trim();
    if (!(ALL_FIELDS as readonly string[]).includes(key)) {
      problems.push({ kind: "unknownRow", line, key });
      continue;
    }
    const field = key as MeasurementField;
    if (seen.has(field)) {
      problems.push({ kind: "duplicateRow", line, key });
      continue;
    }
    seen.add(field);
    readRowCells({ row, line, field, sizes }, { values, problems });
  }
  for (const field of ALL_FIELDS) {
    if (!seen.has(field) && !isOptionalField(field)) problems.push({ kind: "missingRow", field });
  }
  return { values, problems };
}

/** Where a measurement row is and what it is about. */
interface RowContext {
  /** Cells of the row. */
  readonly row: readonly string[];
  /** 1-based file line number. */
  readonly line: number;
  /** Measurement the row is about. */
  readonly field: MeasurementField;
  /** Size labels from the header. */
  readonly sizes: readonly string[];
}

/** What reading collects (changed in place). */
interface Collected {
  /** Values per size. */
  readonly values: BodyValues;
  /** Problems found so far. */
  readonly problems: CsvProblem[];
}

/**
 * Reads the cells of one measurement row.
 *
 * @param context - The row, its line, its measurement and the sizes.
 * @param collected - Values and problems collected so far (changed in place).
 */
function readRowCells(context: RowContext, collected: Collected): void {
  const { row, line, field, sizes } = context;
  sizes.forEach((size, column) => {
    const parsed = parseCm(row[column + 1] ?? "");
    if (parsed.kind === "value")
      (collected.values[size] as Partial<Record<MeasurementField, number>>)[field] = parsed.mm;
    else if (parsed.kind === "error")
      collected.problems.push({ kind: "cell", line, size, field, error: parsed.error });
    else if (!isOptionalField(field))
      collected.problems.push({ kind: "cell", line, size, field, error: "required" });
  });
}

/**
 * Reads a CSV file into a chart, or lists everything wrong with it. The engine's rules are applied too, so the
 * preview shows problems the API would refuse (`SIZE_CHART_INVALID`).
 *
 * @param text - File text.
 * @param locale - Language of the engine messages.
 * @returns The chart or the problems (never both).
 */
export function importChartCsv(text: string, locale: IssueLocale): CsvImport {
  const all = parseCsvRows(text);
  const rows: string[][] = [];
  const lines: number[] = [];
  all.forEach((row, index) => {
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
      lines.push(index + 1);
    }
  });
  if (rows.length === 0) return { sizes: [], problems: [{ kind: "empty" }] };
  const { sizes, problems: headerProblems } = readHeader(rows[0] as string[]);
  const { values, problems: bodyProblems } = readBody(rows, lines, sizes);
  const problems = [...headerProblems, ...bodyProblems];
  if (problems.length > 0) return { sizes, problems };
  const chart = Object.fromEntries(sizes.map((size) => [size, { unit: "mm", ...values[size] }])) as SizeChart;
  const report = validateChart(chart, locale);
  if (report.errors.length > 0) {
    return { sizes, problems: report.errors.map((e) => ({ kind: "engine", size: e.size, text: e.text })) };
  }
  return { sizes, problems: [], chart };
}

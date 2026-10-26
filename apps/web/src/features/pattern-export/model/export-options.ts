/** The files the export dialog offers, in display order (issue #289; issue #290 appends A0). */
import type { ExportKind } from "@/shared/pattern-export";

/** One row of the option list. */
export interface ExportOption {
  /** Which file it makes. */
  readonly kind: ExportKind;
  /** Message key of the row title under `patternExport.option`. */
  readonly key: "a4" | "svg";
}

/** A4 first: it is what most users print at home. */
export const EXPORT_OPTIONS: readonly ExportOption[] = [
  { kind: "a4", key: "a4" },
  { kind: "svg", key: "svg" },
];

/** The kind chosen when the dialog opens. */
export const DEFAULT_EXPORT_KIND: ExportKind = "a4";

/** The files the export dialog offers, in display order (issue #289; A0 added by issue #290). */
import type { ExportKind } from "@/shared/pattern-export";

/** One row of the option list. */
export interface ExportOption {
  /** Which file it makes. */
  readonly kind: ExportKind;
  /** Message key of the row title under `patternExport.option`. */
  readonly key: "a4" | "a0" | "svg";
}

/** A4 first: it is what most users print at home. */
export const EXPORT_OPTIONS: readonly ExportOption[] = [
  { kind: "a4", key: "a4" },
  { kind: "a0", key: "a0" },
  { kind: "svg", key: "svg" },
];

/** The kind chosen when the dialog opens. */
export const DEFAULT_EXPORT_KIND: ExportKind = "a4";

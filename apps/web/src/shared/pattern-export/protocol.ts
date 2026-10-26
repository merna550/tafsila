/** Messages between the page and the export worker: one source of types for both sides (issue #289, ADR-289). */
import type { PdfMeta } from "@tafsila/export";
import type { PreviewInput, PreviewWorkerError } from "../pattern-preview/protocol";

/** The files the export worker can make (issue #290 adds `"a0"`). */
export type ExportKind = "a4" | "svg";

/** What the printed file says about the version. */
export type ExportMeta = PdfMeta;

/** A request posted to the export worker. */
export interface ExportRequest {
  /** Increasing id; every answer carries it back so late answers can be told apart. */
  readonly id: number;
  /** Which file to make. */
  readonly kind: ExportKind;
  /** The stored inputs of the saved version. */
  readonly input: PreviewInput;
  /** Title, version and engine data printed on the file. */
  readonly meta: ExportMeta;
}

/** Progress of a running build: `done` of `total` pages. */
export interface ExportProgress {
  /** Pages finished. */
  readonly done: number;
  /** Pages in the file. */
  readonly total: number;
}

/** A progress message. */
export interface ExportProgressMessage {
  /** Id of the request it belongs to. */
  readonly id: number;
  /** The progress. */
  readonly progress: ExportProgress;
}

/** The final answer of a build. */
export type ExportResult =
  | {
      readonly id: number;
      readonly ok: true;
      readonly kind: ExportKind;
      /** The file; transferred, not copied. SVG is UTF-8 text. */
      readonly bytes: ArrayBuffer;
      /** Media type of the file. */
      readonly mime: string;
      /** Pages of a PDF, null for SVG. */
      readonly pageCount: number | null;
      /** Build time in milliseconds. */
      readonly durationMs: number;
    }
  | { readonly id: number; readonly ok: false; readonly error: PreviewWorkerError };

/** Everything the worker posts back. */
export type ExportMessage = ExportProgressMessage | ExportResult;

/** The outcome `run` resolves with: a final answer, or a mark that a newer request or a cancel replaced this one. */
export type ExportOutcome = ExportResult | { readonly id: number; readonly stale: true };

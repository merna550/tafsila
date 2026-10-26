/** The export worker's logic without `self`: drafts the version again and builds the file (issue #289, ADR-289). */
import { buildPatternScene, generatePattern, renderPrintSheet } from "@tafsila/engine";
import { buildA4Pdf, type PdfFonts } from "@tafsila/export";
import type { PatternResult } from "@tafsila/schemas";
import type { PatternScene } from "@tafsila/engine/viewer";
import type { ExportKind, ExportMessage, ExportMeta, ExportProgress, ExportRequest } from "./protocol";
import { toWorkerError } from "../pattern-preview/worker-error";

/** What the handler needs from outside, so tests need no network. */
export interface ExportDeps {
  /** Loads the two PDF fonts; rejects when they cannot be fetched. */
  loadFonts(): Promise<PdfFonts>;
}

/** A finished file before it is wrapped in a message. */
interface Built {
  readonly bytes: Uint8Array;
  readonly mime: string;
  readonly pageCount: number | null;
}

/** Everything one builder reads. */
interface BuildContext {
  readonly result: PatternResult;
  readonly scene: PatternScene;
  readonly meta: ExportMeta;
  readonly deps: ExportDeps;
  readonly onProgress: (progress: ExportProgress) => void;
}

/** Makes one kind of file. */
type Builder = (context: BuildContext) => Promise<Built>;

/** A failure with a stable code that is not an engine error. */
class ExportFailure extends Error {
  /**
   * Creates the failure.
   *
   * @param code - `FONT_LOAD_FAILED` or `PDF_BUILD_FAILED`.
   * @param cause - What was thrown underneath.
   */
  constructor(
    readonly code: "FONT_LOAD_FAILED" | "PDF_BUILD_FAILED",
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause));
  }
}

/**
 * Builds the A4 tiled PDF.
 *
 * @param context - The drafted pattern and the helpers.
 * @returns The PDF bytes and page count.
 */
async function buildA4(context: BuildContext): Promise<Built> {
  const fonts = await context.deps.loadFonts().catch((error: unknown) => {
    throw new ExportFailure("FONT_LOAD_FAILED", error);
  });
  const output = await buildA4Pdf(context.result, context.scene, context.meta, {
    fonts,
    onProgress: (done, total) => context.onProgress({ done, total }),
  }).catch((error: unknown) => {
    throw new ExportFailure("PDF_BUILD_FAILED", error);
  });
  return { bytes: output.bytes, mime: "application/pdf", pageCount: output.pageCount };
}

/**
 * Builds the SVG print sheet (UTF-8 text).
 *
 * @param context - The drafted pattern.
 * @returns The SVG bytes; no page count.
 */
function buildSvg(context: BuildContext): Promise<Built> {
  return Promise.resolve({
    bytes: new TextEncoder().encode(renderPrintSheet(context.result)),
    mime: "image/svg+xml",
    pageCount: null,
  });
}

/** One builder per kind; issue #290 adds `a0` here. */
const BUILDERS: Record<ExportKind, Builder> = { a4: buildA4, svg: buildSvg };

/**
 * Copies a view into its own buffer so it can be transferred without its neighbours.
 *
 * @param bytes - The file bytes.
 * @returns A buffer that holds exactly the bytes.
 */
function ownBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

/**
 * Drafts the version again and builds the requested file. Never throws: every failure is an answer.
 *
 * @param request - Kind, stored inputs and print meta with the request id.
 * @param deps - Font loader.
 * @param onProgress - Called with the pages done so far (PDF only).
 * @returns The final answer.
 */
export async function runExport(
  request: ExportRequest,
  deps: ExportDeps,
  onProgress: (message: ExportMessage) => void,
): Promise<ExportMessage> {
  const started = performance.now();
  try {
    const { spec, measurements, options } = request.input;
    const result = generatePattern(spec, measurements, options);
    if (result.validation.status === "fail") {
      return {
        id: request.id,
        ok: false,
        error: { code: "PATTERN_INVALID", message: "The pattern did not pass validation" },
      };
    }
    const scene = buildPatternScene(result);
    const built = await BUILDERS[request.kind]({
      result,
      scene,
      meta: request.meta,
      deps,
      onProgress: (progress) => onProgress({ id: request.id, progress }),
    });
    return {
      id: request.id,
      ok: true,
      kind: request.kind,
      bytes: ownBuffer(built.bytes),
      mime: built.mime,
      pageCount: built.pageCount,
      durationMs: performance.now() - started,
    };
  } catch (error) {
    if (error instanceof ExportFailure) {
      return { id: request.id, ok: false, error: { code: error.code, message: error.message } };
    }
    return { id: request.id, ok: false, error: toWorkerError(error) };
  }
}

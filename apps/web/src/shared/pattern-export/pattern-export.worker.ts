/// <reference lib="webworker" />
/** Web Worker that builds the export file off the main thread; the only place `pdf-lib` is loaded in the browser (issue #289). */
import type { PdfFonts } from "@tafsila/export";
import { runExport } from "./export-handler";
import type { ExportMessage, ExportRequest } from "./protocol";

/** Where the two PDF fonts are served from (`apps/web/public/fonts`, decision 282). */
const FONT_URLS = {
  regular: "/fonts/IBMPlexSansArabic-Regular.ttf",
  bold: "/fonts/IBMPlexSansArabic-Bold.ttf",
} as const;

let cachedFonts: Promise<PdfFonts> | null = null;

/**
 * Fetches one font file.
 *
 * @param url - Font URL.
 * @returns The bytes; rejects when the request fails.
 */
async function fetchFont(url: string): Promise<Uint8Array> {
  // eslint-disable-next-line no-restricted-globals -- the worker reads static font files, not the API
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font request failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Loads both fonts once per worker; a failure is not cached, so a retry fetches again.
 *
 * @returns The font bytes.
 */
function loadFonts(): Promise<PdfFonts> {
  cachedFonts ??= Promise.all([fetchFont(FONT_URLS.regular), fetchFont(FONT_URLS.bold)])
    .then(([regular, bold]) => ({ regular, bold }))
    .catch((error: unknown) => {
      cachedFonts = null;
      throw error;
    });
  return cachedFonts;
}

/**
 * Posts a message, transferring the file buffer instead of copying it.
 *
 * @param message - Progress or final answer.
 */
function post(message: ExportMessage): void {
  if ("ok" in message && message.ok) self.postMessage(message, [message.bytes]);
  else self.postMessage(message);
}

self.onmessage = (event: MessageEvent<ExportRequest>): void => {
  void runExport(event.data, { loadFonts }, post).then(post);
};

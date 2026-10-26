import { readFileSync } from "node:fs";
import { ENGINE_VERSION } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { runExport, type ExportDeps } from "./export-handler";
import type { ExportMessage, ExportRequest } from "./protocol";

const FONT_DIR = new URL("../../../public/fonts/", import.meta.url);
const DEPS: ExportDeps = {
  loadFonts: () =>
    Promise.resolve({
      regular: new Uint8Array(readFileSync(new URL("IBMPlexSansArabic-Regular.ttf", FONT_DIR))),
      bold: new Uint8Array(readFileSync(new URL("IBMPlexSansArabic-Bold.ttf", FONT_DIR))),
    }),
};
const META = {
  title: "فستان نور",
  versionNo: 3,
  clientLabel: "",
  engineVersion: ENGINE_VERSION,
  createdAt: "2026-10-01T10:00:00Z",
};

/**
 * Builds a request for the seed dress.
 *
 * @param kind - File kind.
 * @param spec - The spec to draft.
 * @returns The request.
 */
function request(kind: ExportRequest["kind"], spec: unknown = seedDress): ExportRequest {
  return { id: 7, kind, input: { spec, measurements: sizeM }, meta: META };
}

/**
 * Reads bytes as Latin-1 text.
 *
 * @param bytes - File bytes.
 * @returns The text.
 */
function latin1(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("latin1");
}

describe("runExport", () => {
  it("makes an SVG at 1:1 with a width in mm", async () => {
    const answer = await runExport(request("svg"), DEPS, () => undefined);
    if (!("ok" in answer) || !answer.ok) throw new Error("expected a file");
    const text = new TextDecoder().decode(answer.bytes);
    expect(text.startsWith("<svg")).toBe(true);
    expect(text).toMatch(/width="[\d.]+mm"/);
    expect(answer).toMatchObject({ id: 7, kind: "svg", mime: "image/svg+xml", pageCount: null });
  });

  it("makes an A4 PDF whose page count matches the file and reports progress", async () => {
    const progress: ExportMessage[] = [];
    const answer = await runExport(request("a4"), DEPS, (m) => progress.push(m));
    if (!("ok" in answer) || !answer.ok) throw new Error("expected a file");
    const text = latin1(answer.bytes);
    expect(text.startsWith("%PDF-")).toBe(true);
    const pages = text.match(/\/Type \/Page(?!\w)/g) ?? [];
    expect(pages).toHaveLength(Number(answer.pageCount));
    expect(answer.mime).toBe("application/pdf");
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.every((m) => "progress" in m && m.id === 7)).toBe(true);
  });

  it("refuses a pattern that fails validation instead of exporting it", async () => {
    const answer = await runExport(request("a4", null), DEPS, () => undefined);
    expect(answer).toMatchObject({ id: 7, ok: false, error: { code: "PATTERN_INVALID" } });
  });

  it("answers FONT_LOAD_FAILED when the fonts cannot be loaded", async () => {
    const answer = await runExport(
      request("a4"),
      { loadFonts: () => Promise.reject(new Error("offline")) },
      () => undefined,
    );
    expect(answer).toMatchObject({ ok: false, error: { code: "FONT_LOAD_FAILED" } });
  });
});

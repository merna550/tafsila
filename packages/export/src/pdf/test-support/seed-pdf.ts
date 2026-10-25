/** Test support: the seed dress M pattern, its scene and the test fonts (reads files; tests only). */
import { readFileSync } from "node:fs";
import { buildPatternScene, generatePattern, ENGINE_VERSION } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import type { PdfFonts } from "../fonts";
import type { PdfMeta } from "../types";

const fontDir = new URL("../../../../../apps/web/public/fonts/", import.meta.url);

/** The Plex Arabic test fonts from `apps/web/public/fonts`. */
export const testFonts: PdfFonts = {
  regular: new Uint8Array(readFileSync(new URL("IBMPlexSansArabic-Regular.ttf", fontDir))),
  bold: new Uint8Array(readFileSync(new URL("IBMPlexSansArabic-Bold.ttf", fontDir))),
};

/** The seed dress in size M. */
export const seedResult = generatePattern(seedDress, sizeM);
/** Its scene. */
export const seedScene = buildPatternScene(seedResult);
/** Title block data for tests. */
export const seedMeta: PdfMeta = {
  title: "فستان نور",
  versionNo: 3,
  clientLabel: "Nour",
  engineVersion: ENGINE_VERSION,
  createdAt: "2026-10-01T10:00:00Z",
};

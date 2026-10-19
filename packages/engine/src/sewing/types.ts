import type { Piece, SewingStep } from "@tafsila/schemas";

/** The stages of making a garment, in the order they are sewn (decision 146, 1). */
export const SEWING_PHASES = [
  "prepare",
  "darts",
  "shoulders",
  "neckline",
  "sleeves",
  "side-seams",
  "waist-seam",
  "closure",
  "waistband",
  "hem",
  "finish",
] as const;

/** One stage of making a garment. */
export type SewingPhase = (typeof SEWING_PHASES)[number];

/** The catalogue entry of one step: when it happens, what kind of work it is, and the text. */
export interface SewingEntry {
  /** The stage the step belongs to. */
  readonly phase: SewingPhase;
  /** The kind of work; only `sew` and `attach` cover a seam. */
  readonly action: SewingStep["action"];
  /** The instruction in both languages. */
  readonly text: Piece["name"];
}

/** A step found in the pieces, before numbering. */
export interface SewingStepDraft {
  /** The catalogue key; the text never comes from anywhere else. */
  readonly key: string;
  /** The references the step works on: `piece/edge`, `piece/dart:<id>` or a bare `piece`. */
  readonly edges: readonly string[];
}

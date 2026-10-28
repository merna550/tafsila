/**
 * `fabricResult`: pattern and fabric options in, the placement and the length to buy per fabric kind out (FR-FAB-02,
 * FR-FAB-03, FR-FAB-05). It runs `preparePieces`, then `nest`, then `fabricLengthM` for each kind.
 */
import type { FabricOptions, PatternResult } from "@tafsila/schemas";
import { fabricLengthM } from "./length";
import { FABRIC_KINDS, nest } from "./nest";
import { NESTING_VERSION } from "./nesting-version";
import { preparePieces } from "./prepare-pieces";
import type { NestKindResult, PreparedFabrics } from "./types";

/** One fabric kind's placement with its length to buy. */
export interface FabricKindLength extends NestKindResult {
  /** Metres to buy, rounded up to 0.1 m (0 when the kind has no pieces). */
  readonly lengthM: number;
}

/** The fabric calculation of a pattern. */
export interface FabricResult {
  /** The preparation the placement used (the marker scene draws its shapes). */
  readonly prepared: PreparedFabrics;
  /** Main fabric. */
  readonly main: FabricKindLength;
  /** Lining. */
  readonly lining: FabricKindLength;
  /** Interfacing. */
  readonly interfacing: FabricKindLength;
  /** True when the folded layout left a piece out that the open layout would hold. */
  readonly suggestOpen: boolean;
  /** The algorithm version, stored with a saved calculation (decision 316 item 3). */
  readonly nestingVersion: string;
}

/**
 * Adds the length to buy to one kind's placement.
 *
 * @param result - The kind's placement.
 * @param options - The fabric options (shrinkage and repeat).
 * @returns The placement with `lengthM`.
 */
function withLength(result: NestKindResult, options: FabricOptions): FabricKindLength {
  return { ...result, lengthM: fabricLengthM(result.stripLengthMm, options, result.rows) };
}

/**
 * Computes the layout and the length to buy of every fabric kind; main, lining and interfacing stay separate.
 *
 * @param pattern - The engine output.
 * @param options - The fabric options.
 * @returns Placements and lengths per kind, plus the algorithm version.
 * @example
 * fabricResult(generatePattern(seedDress, sizeM), DEFAULT_FABRIC_OPTIONS).main.lengthM // 1.4
 */
export function fabricResult(pattern: PatternResult, options: FabricOptions): FabricResult {
  const prepared = preparePieces(pattern, options);
  const placed = nest(prepared);
  const [main, lining, interfacing] = FABRIC_KINDS.map((kind) => withLength(placed[kind], options));
  return {
    prepared,
    main: main!,
    lining: lining!,
    interfacing: interfacing!,
    suggestOpen: placed.suggestOpen,
    nestingVersion: NESTING_VERSION,
  };
}

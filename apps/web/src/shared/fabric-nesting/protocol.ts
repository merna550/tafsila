/** Messages between the page and the fabric nesting worker: one source of types for both sides (issue #318, ADR-289 pattern). */
import type { DoesNotFit, FabricKind, MarkerPiece, MarkerScene } from "@tafsila/nesting";
import type { FabricOptions, Piece } from "@tafsila/schemas";
import type { PreviewInput, PreviewWorkerError } from "../pattern-preview/protocol";

/** Drawing and report types of the nesting package, re-exported so features need not import the package. */
export type { DoesNotFit, FabricKind, MarkerPiece, MarkerScene };

/** The steps a calculation goes through, in order. */
export type FabricStage = "draft" | "nest";

/** A request posted to the nesting worker. */
export interface FabricRequest {
  /** Increasing id; every answer carries it back so late answers can be told apart. */
  readonly id: number;
  /** The stored inputs of the saved version; the worker drafts the pattern again from them. */
  readonly input: PreviewInput;
  /** The fabric options of this calculation. */
  readonly options: FabricOptions;
}

/** Where a calculation is. */
export interface FabricProgress {
  /** The step that just started. */
  readonly stage: FabricStage;
}

/** A progress message. */
export interface FabricProgressMessage {
  /** Id of the request it belongs to. */
  readonly id: number;
  /** The step that just started. */
  readonly progress: FabricProgress;
}

/** Where one shape lies on the strip, as the API stores it. */
export interface StoredPlacement {
  /** Shape id, `<pieceId>#<n>`. */
  readonly shapeId: string;
  /** x along the strip in mm. */
  readonly xMm: number;
  /** y across the fabric in mm. */
  readonly yMm: number;
  /** Turn in degrees. */
  // eslint-disable-next-line no-magic-numbers -- the API stores a half turn as 180 degrees (ADR-312 item 4)
  readonly turn: 0 | 180;
}

/** The layout and length of one fabric kind. */
export interface FabricKindView {
  /** The fabric kind. */
  readonly kind: FabricKind;
  /** Metres to buy, rounded up to 0.1 (0 when nothing could be placed). */
  readonly lengthM: number;
  /** The placements, ready to save. */
  readonly placements: readonly StoredPlacement[];
  /** The drawing data of the marker diagram. */
  readonly scene: MarkerScene;
}

/** A piece wider than the usable fabric, with its name for the notice. */
export interface FabricDoesNotFit extends DoesNotFit {
  /** The piece name in both languages. */
  readonly name: Piece["name"];
}

/** A finished calculation as the page uses it. */
export interface FabricAnswer {
  /** One entry per fabric kind that has pieces. */
  readonly kinds: readonly FabricKindView[];
  /** Pieces wider than the usable fabric width, across all kinds. */
  readonly doesNotFit: readonly FabricDoesNotFit[];
  /** True when the open layout would hold a piece the folded one cannot. */
  readonly suggestOpen: boolean;
  /** The algorithm version, saved with the calculation. */
  readonly nestingVersion: string;
}

/** The final answer of a calculation. */
export type FabricResultMessage =
  | ({ readonly id: number; readonly ok: true } & FabricAnswer)
  | { readonly id: number; readonly ok: false; readonly error: PreviewWorkerError };

/** Everything the worker posts back. */
export type FabricMessage = FabricProgressMessage | FabricResultMessage;

/** The outcome `run` resolves with: a final answer, or a mark that a newer request or a cancel replaced this one. */
export type FabricOutcome = FabricResultMessage | { readonly id: number; readonly stale: true };

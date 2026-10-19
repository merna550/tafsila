/** The immutable value that flows through the pipeline steps (ARCHITECTURE §3). */
import type {
  DesignSpec,
  EngineOptions,
  Measurements,
  Notion,
  Piece,
  ValidationCheck,
} from "@tafsila/schemas";
import type { ResolvedDraftInputs } from "../resolve/types";

/** A piece in progress: the finishing step adds the cut path, labels and bounding box later. */
export type PieceDraft = Omit<Piece, "cutPath" | "labels" | "bbox"> &
  Partial<Pick<Piece, "cutPath" | "labels" | "bbox">>;

/** Everything a pipeline step may read, and the work done so far. Never mutated: steps return a new one. */
export interface DraftContext {
  /** The validated design. */
  readonly spec: DesignSpec;
  /** The validated body measurements, in mm. */
  readonly measurements: Measurements;
  /** The validated engine options. */
  readonly options: EngineOptions;
  /** The block inputs from the resolve step (#126); undefined before it runs (#128). */
  readonly inputs: ResolvedDraftInputs | undefined;
  /** Named numbers in mm that steps pass on, such as the bodice armhole lengths for the sleeve (#128). */
  readonly resolved: Readonly<Record<string, number>>;
  /** Pieces drafted so far. */
  readonly pieces: readonly PieceDraft[];
  /** Report items collected so far (input warnings, validation results). */
  readonly checks: readonly ValidationCheck[];
  /** Notions cut by length, such as waist elastic (#140); absent until a module adds one. */
  readonly notions?: readonly Notion[];
}

/** One pipeline step: a pure function from a frozen context to a new one. */
export type Step = (ctx: DraftContext) => DraftContext;

/**
 * Starts a context for one run.
 *
 * @param spec - Validated design.
 * @param measurements - Validated measurements.
 * @param options - Validated options.
 * @param checks - Report items already known, such as input warnings.
 * @returns A frozen context with no pieces.
 */
export function createContext(
  spec: DesignSpec,
  measurements: Measurements,
  options: EngineOptions,
  checks: readonly ValidationCheck[] = [],
): DraftContext {
  return Object.freeze({
    spec,
    measurements,
    options,
    inputs: undefined,
    resolved: Object.freeze({}),
    pieces: Object.freeze([]),
    checks,
  });
}

/**
 * Returns a context with one more piece. A piece with the same id replaces the old one (a change returns a new piece).
 *
 * @param ctx - Current context.
 * @param piece - The piece to add or replace.
 * @returns A new frozen context.
 */
export function withPiece(ctx: DraftContext, piece: PieceDraft): DraftContext {
  const kept = ctx.pieces.filter((p) => p.id !== piece.id);
  return Object.freeze({ ...ctx, pieces: Object.freeze([...kept, piece]) });
}

/**
 * Returns a context whose pieces are replaced by the given list, in that order (used by the finishing steps).
 *
 * @param ctx - Current context.
 * @param pieces - The new pieces.
 * @returns A new frozen context.
 */
export function withPieces(ctx: DraftContext, pieces: readonly PieceDraft[]): DraftContext {
  return Object.freeze({ ...ctx, pieces: Object.freeze([...pieces]) });
}

/**
 * Returns a context with one more report item.
 *
 * @param ctx - Current context.
 * @param check - The report item to add.
 * @returns A new frozen context.
 */
export function withCheck(ctx: DraftContext, check: ValidationCheck): DraftContext {
  return Object.freeze({ ...ctx, checks: Object.freeze([...ctx.checks, check]) });
}

/**
 * Returns a context with named drafting inputs merged in.
 *
 * @param ctx - Current context.
 * @param values - Named numbers in mm.
 * @returns A new frozen context.
 */
export function withResolved(ctx: DraftContext, values: Readonly<Record<string, number>>): DraftContext {
  return Object.freeze({ ...ctx, resolved: Object.freeze({ ...ctx.resolved, ...values }) });
}

/**
 * Returns a context with the resolved block inputs.
 *
 * @param ctx - Current context.
 * @param inputs - Output of `resolveDraftInputs`.
 * @returns A new frozen context.
 */
export function withInputs(ctx: DraftContext, inputs: ResolvedDraftInputs): DraftContext {
  return Object.freeze({ ...ctx, inputs: Object.freeze(inputs) });
}

/**
 * Returns a context with one more notion. A notion with the same id replaces the old one.
 *
 * @param ctx - Current context.
 * @param notion - The notion to add or replace.
 * @returns A new frozen context.
 */
export function withNotion(ctx: DraftContext, notion: Notion): DraftContext {
  const kept = (ctx.notions ?? []).filter((n) => n.id !== notion.id);
  return Object.freeze({ ...ctx, notions: Object.freeze([...kept, notion]) });
}

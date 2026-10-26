/** Tick state of the direct-cut checklist: which steps are done, kept per version and curve step in the browser (issue #291). */
import type { CutPlanStep } from "@/shared/pattern-preview";

/** Storage format version of a stored entry. */
const TICKS_FORMAT = 1;

/** What is stored for one version and curve step. */
export interface StoredTicks {
  /** Format version. */
  readonly v: 1;
  /** Engine version the steps came from; other versions' ticks are ignored because the steps may differ. */
  readonly engineVersion: string;
  /** Ids of the ticked steps. */
  readonly ticked: readonly string[];
}

/**
 * The storage key of one version at one curve step (the step lists differ, so their ticks do too).
 *
 * @param versionId - Version id.
 * @param curveStepMm - Gap between curve points, mm.
 * @returns The key.
 */
export function ticksKey(versionId: string, curveStepMm: number): string {
  return `tafsila.cut.ticks.${versionId}.${curveStepMm}`;
}

/**
 * Builds the entry to store.
 *
 * @param engineVersion - Engine version of the steps.
 * @param ticked - The ticked step ids.
 * @returns The entry.
 */
export function toStoredTicks(engineVersion: string, ticked: ReadonlySet<string>): StoredTicks {
  return { v: TICKS_FORMAT, engineVersion, ticked: [...ticked] };
}

/**
 * Reads a stored entry; junk, an unknown shape or another engine version gives an empty set.
 *
 * @param raw - The parsed storage value.
 * @param engineVersion - Engine version of the steps on screen.
 * @returns The ticked step ids.
 */
export function parseTicks(raw: unknown, engineVersion: string): ReadonlySet<string> {
  if (typeof raw !== "object" || raw === null) return new Set();
  const entry = raw as Partial<StoredTicks>;
  const valid =
    entry.v === TICKS_FORMAT &&
    entry.engineVersion === engineVersion &&
    Array.isArray(entry.ticked) &&
    entry.ticked.every((id) => typeof id === "string");
  return valid ? new Set(entry.ticked) : new Set();
}

/**
 * Ticks a step, or unticks it when it was ticked.
 *
 * @param ticked - The ticked ids.
 * @param id - The step id.
 * @returns A new set.
 */
export function toggleTick(ticked: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(ticked);
  if (!next.delete(id)) next.add(id);
  return next;
}

/**
 * The state after "clear ticks".
 *
 * @returns An empty set.
 */
export function clearTicks(): ReadonlySet<string> {
  return new Set();
}

/** How far a piece is. */
export interface PieceProgress {
  /** Steps ticked. */
  readonly done: number;
  /** Steps in the piece. */
  readonly total: number;
}

/**
 * Counts the ticked steps of a piece; ids that are not in its steps (a stale entry) are ignored.
 *
 * @param steps - The piece's steps.
 * @param ticked - The ticked ids.
 * @returns Done and total.
 */
export function pieceProgress(steps: readonly CutPlanStep[], ticked: ReadonlySet<string>): PieceProgress {
  return { done: steps.filter((step) => ticked.has(step.id)).length, total: steps.length };
}

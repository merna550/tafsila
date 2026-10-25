/** Debounce and state of the preview, without React so it is tested with a fake worker and fake timers (issue #239). */
import type { PatternScene } from "@tafsila/engine/viewer";
import type { PatternResult } from "@tafsila/schemas";
import type { PreviewClient } from "./preview-client";
import type { PreviewInput, PreviewWorkerError } from "./protocol";

/**
 * Wait after the last input change before drafting, in milliseconds. Kept well under FR-PAT-04's 500 ms so a draft
 * of a few tens of milliseconds still lands inside the budget after the user stops typing.
 */
export const PATTERN_PREVIEW_DEBOUNCE_MS = 250;

/** What the page shows about the preview. */
export interface PreviewState {
  /** `idle` before the first draft, `running` while the worker drafts. */
  readonly status: "idle" | "running" | "done" | "error";
  /** The latest successful pattern; kept while a newer draft runs. */
  readonly result?: PatternResult;
  /** What the viewer draws for `result`, built in the worker so no geometry code reaches the page. */
  readonly scene?: PatternScene;
  /** Set when `status` is `error`. */
  readonly error?: PreviewWorkerError;
  /** Time the worker needed for the latest draft. */
  readonly durationMs?: number;
  /** Hash of the spec, measurements and options (`meta.createdFrom`); equals the saved version's `input_hash` when unchanged. */
  readonly inputHash?: string;
  /** The exact input object this state answers; the page compares it with its current input to tell a stale draft. */
  readonly input?: PreviewInput;
}

/** Starts drafts for inputs and reports the state. */
export interface PreviewController {
  /** Schedules a draft after the debounce; the last call wins. `null` cancels and returns to idle. */
  submit(input: PreviewInput | null): void;
  /** Cancels timers; later answers are ignored. */
  dispose(): void;
}

/** The state before anything ran. */
export const IDLE_PREVIEW_STATE: PreviewState = { status: "idle" };

/**
 * Creates the controller.
 *
 * @param client - The worker connection.
 * @param onState - Called with each new state.
 * @param debounceMs - Wait before drafting.
 * @returns The controller.
 */
export function createPreviewController(
  client: PreviewClient,
  onState: (state: PreviewState) => void,
  debounceMs: number = PATTERN_PREVIEW_DEBOUNCE_MS,
): PreviewController {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let last: PreviewState = IDLE_PREVIEW_STATE;

  /**
   * Publishes a state.
   *
   * @param state - The new state.
   */
  function emit(state: PreviewState): void {
    last = state;
    onState(state);
  }

  /**
   * Drafts one input and publishes the answer unless a newer one began.
   *
   * @param input - What to draft.
   * @param mine - Generation number of this request.
   */
  async function start(input: PreviewInput, mine: number): Promise<void> {
    emit({ ...last, status: "running" });
    const outcome = await client.run(input);
    if (mine !== generation || "stale" in outcome) return;
    if (outcome.ok) {
      const { result, scene, durationMs } = outcome;
      emit({ status: "done", result, scene, durationMs, inputHash: result.meta.createdFrom, input });
    } else {
      emit({ status: "error", error: outcome.error, input });
    }
  }

  return {
    submit(input) {
      clearTimeout(timer);
      generation += 1;
      const mine = generation;
      if (input === null) {
        emit(IDLE_PREVIEW_STATE);
        return;
      }
      timer = setTimeout(() => void start(input, mine), debounceMs);
    },
    dispose() {
      clearTimeout(timer);
      generation += 1;
    },
  };
}

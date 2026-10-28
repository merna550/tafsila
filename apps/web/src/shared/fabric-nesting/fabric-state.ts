/** The calculator's state machine as a pure reducer: idle, running, done, error (issue #318). */
import type { ApiError } from "../api";
import type { FabricAnswer, FabricProgress } from "./protocol";

/** Where a calculation is. */
export type FabricState =
  | { readonly status: "idle" }
  | { readonly status: "running"; readonly progress: FabricProgress | null }
  | { readonly status: "done"; readonly answer: FabricAnswer }
  | { readonly status: "error"; readonly error: ApiError };

/** What can happen to a calculation. */
export type FabricAction =
  | { readonly type: "start" }
  | { readonly type: "progress"; readonly progress: FabricProgress }
  | { readonly type: "done"; readonly answer: FabricAnswer }
  | { readonly type: "fail"; readonly error: ApiError }
  | { readonly type: "reset" };

/** The state before anything runs. */
export const IDLE_FABRIC_STATE: FabricState = { status: "idle" };

/**
 * Moves the calculation to its next state. Answers that arrive when nothing is running (after a cancel) are ignored.
 *
 * @param state - The current state.
 * @param action - What happened.
 * @returns The next state.
 */
export function fabricReducer(state: FabricState, action: FabricAction): FabricState {
  if (action.type === "reset") return IDLE_FABRIC_STATE;
  if (action.type === "start") return { status: "running", progress: null };
  if (state.status !== "running") return state;
  switch (action.type) {
    case "progress":
      return { status: "running", progress: action.progress };
    case "done":
      return { status: "done", answer: action.answer };
    case "fail":
      return { status: "error", error: action.error };
  }
}

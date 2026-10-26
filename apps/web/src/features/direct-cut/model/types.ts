/** Shapes the direct-cut hooks return and the components take, kept apart from the hooks so components never import a hook. */
import type { PatternVersionDetail } from "@tafsila/schemas";
import type { CutPiecePlan, CutPlan, CutPlanStep, CutStepsState } from "@/shared/pattern-preview";
import type { CurveStepMm } from "./settings";

/** What the checklist uses. */
export interface TicksController {
  /** The ticked step ids. */
  readonly ticked: ReadonlySet<string>;
  /** Ticks or unticks a step. */
  readonly toggle: (id: string) => void;
  /** Unticks every step. */
  readonly clear: () => void;
}

/** What the current-step hook returns. */
export interface CurrentStepController {
  /** The current step, or `null` when every step is ticked. */
  readonly current: CutPlanStep | null;
  /** Makes a step current (tap or keyboard focus). */
  readonly select: (id: string) => void;
  /** Clears the tap, so the current step moves to the first unticked one. */
  readonly clear: () => void;
}

/** What the screen uses. */
export interface CutSettings {
  /** Gap between curve points, mm. */
  readonly curveStepMm: CurveStepMm;
  /** True once the stored value has been read; the steps wait for it so they are worked out once. */
  readonly loaded: boolean;
  /** Changes and stores the gap. */
  readonly setCurveStepMm: (value: CurveStepMm) => void;
}

/** What the screen shows. */
export interface DirectCut {
  /** The version query (loading and error). */
  readonly query: {
    readonly isPending: boolean;
    readonly error: unknown;
    readonly refetch: () => Promise<unknown>;
  };
  /** The loaded detail, if any. */
  readonly detail: PatternVersionDetail | undefined;
  /** The design title, or null while loading. */
  readonly title: string | null;
  /** The steps' state; `plan` is only set when it matches the chosen curve step. */
  readonly steps: Omit<CutStepsState, "plan"> & { readonly plan?: CutPlan; readonly retry: () => void };
  /** The curve step setting. */
  readonly settings: CutSettings;
  /** The ticks of this version at this curve step. */
  readonly ticks: TicksController;
  /** The chosen piece, if the plan has pieces. */
  readonly piece: CutPiecePlan | undefined;
  /** The current step of the chosen piece (the one the diagram highlights). */
  readonly current: CurrentStepController;
  /** Chooses a piece. */
  readonly choosePiece: (pieceId: string) => void;
  /** True while the print view is shown on screen. */
  readonly printView: boolean;
  /** Shows or hides the print view. */
  readonly setPrintView: (value: boolean) => void;
}

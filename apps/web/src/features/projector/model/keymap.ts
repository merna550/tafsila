/** The keys of the projector page, matched by `event.code` so an Arabic keyboard layout works (issue #286). */
import { stepMm, type StepMm } from "./projector-view";

/** What a key press asks for. The piece actions are handled by issue #287. */
export type ProjectorAction =
  | { readonly kind: "pan"; readonly dx: -1 | 0 | 1; readonly dy: -1 | 0 | 1; readonly stepMm: StepMm }
  | { readonly kind: "mirror" }
  | { readonly kind: "help" }
  | { readonly kind: "lineWidth"; readonly delta: 1 | -1 }
  | { readonly kind: "rotate" }
  | { readonly kind: "reset" }
  | { readonly kind: "nextPiece" }
  | { readonly kind: "prevPiece" }
  | { readonly kind: "allPieces" }
  | { readonly kind: "pieces" }
  | { readonly kind: "clearActive" }
  | { readonly kind: "fullscreen" };

/** The part of a keyboard event the map reads. */
export interface KeyInput {
  readonly code: string;
  readonly key: string;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

const ARROWS: Readonly<Record<string, readonly [-1 | 0 | 1, -1 | 0 | 1]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const SIMPLE: Readonly<Record<string, ProjectorAction>> = {
  KeyM: { kind: "mirror" },
  KeyF: { kind: "fullscreen" },
  BracketLeft: { kind: "lineWidth", delta: -1 },
  BracketRight: { kind: "lineWidth", delta: 1 },
  KeyR: { kind: "rotate" },
  KeyL: { kind: "pieces" },
  KeyA: { kind: "allPieces" },
  PageUp: { kind: "prevPiece" },
  PageDown: { kind: "nextPiece" },
  Digit0: { kind: "reset" },
  Escape: { kind: "clearActive" },
};

/**
 * Maps a key press to an action.
 *
 * @param e - The keyboard event.
 * @returns The action, or null for a key the page does not use.
 */
export function keyAction(e: KeyInput): ProjectorAction | null {
  const arrow = ARROWS[e.code];
  if (arrow) return { kind: "pan", dx: arrow[0], dy: arrow[1], stepMm: stepMm(e) };
  if (e.code === "Slash" && e.shiftKey) return { kind: "help" };
  return SIMPLE[e.code] ?? null;
}

/** Ids of the help rows: keys of `projector.help.rows`. */
export type HelpRowId =
  | "pan1"
  | "pan10"
  | "pan50"
  | "rotate"
  | "pieces"
  | "nextPiece"
  | "allPieces"
  | "clearActive"
  | "reset"
  | "mirror"
  | "widthLess"
  | "widthMore"
  | "fullscreen"
  | "help";

/** One row of the help window: message keys of `projector.help` and a sample key press that triggers it. */
export interface HelpRow {
  /** Key of the description in `projector.help.rows`. */
  readonly id: HelpRowId;
  /** How the keys are written (always left to right). */
  readonly keys: string;
  /** A key press that must map to an action. */
  readonly sample: KeyInput;
}

const NO_MODS = { shiftKey: false, altKey: false };

/** The rows of the help window; the test checks that each sample maps to an action. */
export const HELP_ROWS: readonly HelpRow[] = [
  { id: "pan1", keys: "← ↑ → ↓", sample: { code: "ArrowLeft", key: "ArrowLeft", ...NO_MODS } },
  {
    id: "pan10",
    keys: "Shift + ←",
    sample: { code: "ArrowLeft", key: "ArrowLeft", shiftKey: true, altKey: false },
  },
  {
    id: "pan50",
    keys: "Alt + ←",
    sample: { code: "ArrowLeft", key: "ArrowLeft", shiftKey: false, altKey: true },
  },
  { id: "rotate", keys: "R", sample: { code: "KeyR", key: "r", ...NO_MODS } },
  { id: "pieces", keys: "L", sample: { code: "KeyL", key: "l", ...NO_MODS } },
  { id: "nextPiece", keys: "PgUp / PgDn", sample: { code: "PageDown", key: "PageDown", ...NO_MODS } },
  { id: "allPieces", keys: "A", sample: { code: "KeyA", key: "a", ...NO_MODS } },
  { id: "clearActive", keys: "Esc", sample: { code: "Escape", key: "Escape", ...NO_MODS } },
  { id: "reset", keys: "0", sample: { code: "Digit0", key: "0", ...NO_MODS } },
  { id: "mirror", keys: "M", sample: { code: "KeyM", key: "m", ...NO_MODS } },
  { id: "widthLess", keys: "[", sample: { code: "BracketLeft", key: "[", ...NO_MODS } },
  { id: "widthMore", keys: "]", sample: { code: "BracketRight", key: "]", ...NO_MODS } },
  { id: "fullscreen", keys: "F", sample: { code: "KeyF", key: "f", ...NO_MODS } },
  { id: "help", keys: "?", sample: { code: "Slash", key: "?", shiftKey: true, altKey: false } },
];

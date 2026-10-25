/** The report row the user chose, shared by the hook that owns it and the panel that shows it. */
import type { ViewerTarget } from "@/features/pattern-viewer";

/** The chosen row and the handler for the report panel. */
export interface ReportSelection {
  /** Key of the chosen row, or null. */
  readonly key: string | null;
  /** Chooses a row (its targets are highlighted and framed) or clears the choice with `null`. */
  readonly select: (key: string | null, targets: readonly ViewerTarget[]) => void;
}

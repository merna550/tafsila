/** The notice shown when the rules changed other features after a choice, with undo and close. */
import { Button, CloseIcon } from "@tafsila/ui";
import type { ReactElement } from "react";

/** Props for {@link ResetNotice}. */
interface ResetNoticeProps {
  /** What changed (already translated). */
  readonly message: string;
  /** Text of the undo button. */
  readonly undoLabel: string;
  /** Accessible name of the close button. */
  readonly dismissLabel: string;
  /** Restores the previous design. */
  readonly onUndo: () => void;
  /** Hides the notice. */
  readonly onDismiss: () => void;
}

/**
 * Renders the notice as a status message.
 *
 * @param props - Texts and handlers.
 * @returns The notice.
 */
export function ResetNotice({
  message,
  undoLabel,
  dismissLabel,
  onUndo,
  onDismiss,
}: Readonly<ResetNoticeProps>): ReactElement {
  return (
    <div role="status" className="flex items-center gap-3 rounded-lg border border-info bg-primary-soft p-3">
      <p className="flex-1 text-base">{message}</p>
      <Button variant="secondary" onClick={onUndo}>
        {undoLabel}
      </Button>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={onDismiss}
        className="flex size-8 items-center justify-center rounded-full hover:bg-surface-hover"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}

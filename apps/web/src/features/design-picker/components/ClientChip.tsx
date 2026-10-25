/** The "for client" chip shown when a design is made from a client's profile. */
import { CloseIcon } from "@tafsila/ui";
import type { ReactElement } from "react";

/** Props for {@link ClientChip}. */
interface ClientChipProps {
  /** Text such as "For: Salma" (already translated). */
  readonly label: string;
  /** Accessible name of the remove button; the button shows only when `onRemove` is given. */
  readonly removeLabel: string;
  /** Called to forget the client. */
  readonly onRemove?: () => void;
}

/**
 * Renders the chip, with a remove button when the client can still be changed.
 *
 * @param props - Label and remove handler.
 * @returns The chip.
 */
export function ClientChip({ label, removeLabel, onRemove }: Readonly<ClientChipProps>): ReactElement {
  return (
    <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-soft ps-4 pe-2 text-base font-semibold text-primary">
      {label}
      {onRemove !== undefined && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="flex size-8 items-center justify-center rounded-full hover:bg-surface-hover"
        >
          <CloseIcon className="size-4" />
        </button>
      )}
    </span>
  );
}

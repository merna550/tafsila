/** The primary "new client" button with a plus icon (used in the header and in the empty state). */
import { Button, PlusIcon } from "@tafsila/ui";
import type { ReactElement } from "react";

/** Props for {@link NewClientButton}. */
interface NewClientButtonProps {
  /** Button text. */
  readonly label: string;
  /** Opens the create dialog. */
  readonly onClick: () => void;
}

/**
 * Renders the button.
 *
 * @param props - Label and click handler.
 * @returns The button.
 */
export function NewClientButton({ label, onClick }: Readonly<NewClientButtonProps>): ReactElement {
  return (
    <Button onClick={onClick}>
      <PlusIcon className="size-5" />
      {label}
    </Button>
  );
}

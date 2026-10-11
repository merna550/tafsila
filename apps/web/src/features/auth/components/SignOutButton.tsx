/** Sign-out button; presentational: behaviour comes in through props (ADR-029). */
import { Button } from "@tafsila/ui";
import type { ReactElement } from "react";

/** Props for {@link SignOutButton}. */
interface SignOutButtonProps {
  /** Button text. */
  readonly label: string;
  /** True while the sign-out request runs. */
  readonly pending: boolean;
  /** Called on click. */
  readonly onSignOut: () => void;
}

/**
 * Renders the sign-out button.
 *
 * @param props - Label, pending state and click handler.
 * @returns The button.
 */
export function SignOutButton({ label, pending, onSignOut }: Readonly<SignOutButtonProps>): ReactElement {
  return (
    <Button variant="secondary" disabled={pending} onClick={onSignOut}>
      {label}
    </Button>
  );
}

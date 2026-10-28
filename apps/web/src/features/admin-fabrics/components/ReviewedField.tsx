/** The "this item was reviewed" checkbox that removes the draft tag. */
import { Checkbox } from "@tafsila/ui";
import type { ReactElement } from "react";

/** Props of {@link ReviewedField}. */
interface ReviewedFieldProps {
  /** Whether it is checked. */
  readonly checked: boolean;
  /** Called with the new state. */
  readonly onChange: (checked: boolean) => void;
  /** Text of the label. */
  readonly label: string;
}

/**
 * Renders the labelled checkbox.
 *
 * @param props - State, handler and label.
 * @returns The checkbox.
 */
export function ReviewedField({ checked, onChange, label }: Readonly<ReviewedFieldProps>): ReactElement {
  return (
    <label className="flex min-h-11 items-center gap-2 text-base text-text">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}

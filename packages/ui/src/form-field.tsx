/** FormField: label + control + hint + error slot, wired together with the right ids and ARIA attributes. */
import * as RadixLabel from "@radix-ui/react-label";
import { useId, type ReactElement, type ReactNode } from "react";
import { cx } from "./styles";

/** Attributes the control inside a {@link FormField} must receive so label, hint and error are announced. */
export interface FormFieldControlProps {
  /** Id the label points at. */
  readonly id: string;
  /** Ids of the hint and error elements that exist. */
  readonly "aria-describedby": string | undefined;
  /** True while an error is shown. */
  readonly "aria-invalid": boolean;
}

/** Props for {@link FormField}. */
export interface FormFieldProps {
  /** Visible label (already translated). */
  readonly label: ReactNode;
  /** Optional help text under the control. */
  readonly hint?: ReactNode;
  /** Error text; shown under the control in the danger colour and announced to screen readers. */
  readonly error?: ReactNode;
  /** Render function receiving the id and ARIA attributes to spread on the control. */
  readonly children: (control: FormFieldControlProps) => ReactNode;
  /** Extra classes for the wrapper. */
  readonly className?: string;
}

/**
 * Wraps a control with its label, hint and error message.
 *
 * @param props - Label, hint, error and the control render function.
 * @returns The field element.
 * @example
 * <FormField label={t("client.name")} error={errors.name}>{(control) => <Input {...control} />}</FormField>
 */
export function FormField({
  label,
  hint,
  error,
  children,
  className,
}: Readonly<FormFieldProps>): ReactElement {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <RadixLabel.Root htmlFor={id} className="text-sm font-semibold text-text">
        {label}
      </RadixLabel.Root>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

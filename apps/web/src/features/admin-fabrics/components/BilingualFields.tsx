/** Two inputs side by side for the Arabic and the English version of one text (names, care notes, reasons). */
import { FormField, Input } from "@tafsila/ui";
import type { ReactElement } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

/** Props of {@link BilingualFields}. */
interface BilingualFieldsProps {
  /** Label of the Arabic input. */
  readonly arLabel: string;
  /** Label of the English input. */
  readonly enLabel: string;
  /** Registration of the Arabic input. */
  readonly arRegister: UseFormRegisterReturn;
  /** Registration of the English input. */
  readonly enRegister: UseFormRegisterReturn;
  /** Error under the Arabic input. */
  readonly arError?: string;
  /** Error under the English input. */
  readonly enError?: string;
}

/**
 * Renders the pair; the English input is left to right.
 *
 * @param props - Labels, registrations and errors.
 * @returns The two fields.
 */
export function BilingualFields(props: Readonly<BilingualFieldsProps>): ReactElement {
  const { arLabel, enLabel, arRegister, enRegister, arError, enError } = props;
  return (
    <div className="flex flex-wrap gap-4">
      <FormField className="flex-1 basis-56" label={arLabel} error={arError}>
        {(c) => <Input {...c} {...arRegister} />}
      </FormField>
      <FormField className="flex-1 basis-56" label={enLabel} error={enError}>
        {(c) => <Input dir="ltr" {...c} {...enRegister} />}
      </FormField>
    </div>
  );
}

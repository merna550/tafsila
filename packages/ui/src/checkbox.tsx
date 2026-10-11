/** Checkbox: a themed checkbox on Radix (keyboard and indeterminate state included). The label is a separate element. */
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { CheckIcon } from "./icons";
import { CONTROL_BASE, cx } from "./styles";

/** Props for {@link Checkbox}: Radix checkbox props (`checked`, `onCheckedChange`, `disabled`, `id` ...). */
export type CheckboxProps = ComponentPropsWithoutRef<typeof RadixCheckbox.Root>;

/**
 * Renders a checkbox that is at least 24px (inside a 44px label row when used with a label).
 *
 * @param props - Radix checkbox props.
 * @returns The checkbox element.
 * @example
 * <Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} />
 */
export function Checkbox({ className, ...rest }: Readonly<CheckboxProps>): ReactElement {
  return (
    <RadixCheckbox.Root
      className={cx(
        CONTROL_BASE,
        "size-6 rounded-sm aria-checked:border-primary aria-checked:bg-primary",
        className,
      )}
      {...rest}
    >
      <RadixCheckbox.Indicator className="flex items-center justify-center text-on-primary">
        <CheckIcon className="size-4" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

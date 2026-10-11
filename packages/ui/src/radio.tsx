/** Radio: a themed radio group on Radix (arrow-key navigation included). */
import * as RadixRadio from "@radix-ui/react-radio-group";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { CONTROL_BASE, cx } from "./styles";

/** Props for {@link RadioGroup}: Radix radio group props (`value`, `onValueChange`, `dir`, `name` ...). */
export type RadioGroupProps = ComponentPropsWithoutRef<typeof RadixRadio.Root>;

/** Props for {@link Radio}: Radix radio item props (`value` is required, `id` links a label). */
export type RadioProps = ComponentPropsWithoutRef<typeof RadixRadio.Item>;

/**
 * Groups radios so only one can be chosen.
 *
 * @param props - Radix radio group props.
 * @returns The group element.
 * @example
 * <RadioGroup value={size} onValueChange={setSize}><Radio value="m" id="m" /></RadioGroup>
 */
export function RadioGroup({ className, ...rest }: Readonly<RadioGroupProps>): ReactElement {
  return <RadixRadio.Root className={cx("flex flex-col gap-2", className)} {...rest} />;
}

/**
 * Renders one radio button of a {@link RadioGroup}.
 *
 * @param props - Radix radio item props.
 * @returns The radio element.
 */
export function Radio({ className, ...rest }: Readonly<RadioProps>): ReactElement {
  return (
    <RadixRadio.Item
      className={cx(CONTROL_BASE, "size-6 rounded-full aria-checked:border-primary", className)}
      {...rest}
    >
      <RadixRadio.Indicator className="flex items-center justify-center">
        <span className="size-3 rounded-full bg-primary" />
      </RadixRadio.Indicator>
    </RadixRadio.Item>
  );
}

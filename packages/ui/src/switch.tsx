/** Switch: an on/off toggle on Radix; the thumb slides in the reading direction (RTL-safe). */
import * as RadixSwitch from "@radix-ui/react-switch";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { CONTROL_BASE, cx } from "./styles";

/** Props for {@link Switch}: Radix switch props (`checked`, `onCheckedChange`, `disabled`, `id` ...). */
export type SwitchProps = ComponentPropsWithoutRef<typeof RadixSwitch.Root>;

/**
 * Renders a toggle switch.
 *
 * @param props - Radix switch props.
 * @returns The switch element.
 * @example
 * <Switch id="notify" checked={on} onCheckedChange={setOn} />
 */
export function Switch({ className, ...rest }: Readonly<SwitchProps>): ReactElement {
  return (
    <RadixSwitch.Root
      className={cx(CONTROL_BASE, "group h-7 w-12 rounded-full p-0.5 aria-checked:bg-primary", className)}
      {...rest}
    >
      <RadixSwitch.Thumb className="block size-5.5 rounded-full bg-text transition-transform duration-fast group-aria-checked:translate-x-5 group-aria-checked:bg-on-primary rtl:group-aria-checked:-translate-x-5" />
    </RadixSwitch.Root>
  );
}

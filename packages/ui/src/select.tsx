/** Select: a themed dropdown built on Radix Select (keyboard, typeahead and screen-reader support included). */
import * as RadixSelect from "@radix-ui/react-select";
import type { ReactElement } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";
import { FIELD_BASE, cx } from "./styles";

/** One choice in a {@link Select}. */
export interface SelectOption {
  /** Value reported on change; must not be an empty string. */
  readonly value: string;
  /** Text shown to the user (already translated). */
  readonly label: string;
  /** When true the option cannot be chosen. */
  readonly disabled?: boolean;
}

/** Props for {@link Select}. */
export interface SelectProps {
  /** The choices. */
  readonly options: readonly SelectOption[];
  /** Controlled value. */
  readonly value?: string;
  /** Initial value when uncontrolled. */
  readonly defaultValue?: string;
  /** Called with the new value. */
  readonly onValueChange?: (value: string) => void;
  /** Text shown while nothing is chosen (already translated). */
  readonly placeholder?: string;
  /** Id of the trigger, so a label can point at it. */
  readonly id?: string;
  /** Form field name (renders a hidden native select for forms). */
  readonly name?: string;
  /** Disables the control. */
  readonly disabled?: boolean;
  /** Reading direction of the menu; pass the page direction ("rtl" for Arabic). */
  readonly dir?: "rtl" | "ltr";
  /** Extra classes for the trigger. */
  readonly className?: string;
  /** Id of the element describing the field (hint or error). */
  readonly "aria-describedby"?: string;
  /** Marks the field as invalid. */
  readonly "aria-invalid"?: boolean;
}

/** Classes of the open list. */
const CONTENT_CLASSES =
  "z-dropdown max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-surface shadow-overlay";

/** Classes of one option. */
const ITEM_CLASSES =
  "relative flex min-h-11 cursor-pointer select-none items-center gap-2 ps-8 pe-3 text-base text-text outline-none data-highlighted:bg-surface-hover data-disabled:opacity-50";

/**
 * Renders a dropdown of options.
 *
 * @param props - Options, value handlers and field attributes.
 * @returns The select element.
 * @example
 * <Select options={cities} placeholder={t("city.pick")} onValueChange={setCity} dir="rtl" />
 */
export function Select({
  options,
  placeholder,
  id,
  className,
  dir,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...root
}: Readonly<SelectProps>): ReactElement {
  return (
    <RadixSelect.Root dir={dir} {...root}>
      <RadixSelect.Trigger
        id={id}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={cx(FIELD_BASE, "flex min-h-11 items-center justify-between gap-2 text-start", className)}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDownIcon className="size-4 text-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content position="popper" sideOffset={4} className={CONTENT_CLASSES}>
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={ITEM_CLASSES}
              >
                <RadixSelect.ItemIndicator className="absolute start-2">
                  <CheckIcon className="size-4 text-primary" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

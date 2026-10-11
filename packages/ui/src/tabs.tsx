/** Tabs: switch between panels of one page, built on Radix Tabs (arrow keys, RTL aware). */
import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactElement, ReactNode } from "react";
import { FOCUS_RING, cx } from "./styles";

/** One tab and its panel. */
export interface TabItem {
  /** Unique value identifying the tab. */
  readonly value: string;
  /** Tab text (already translated). */
  readonly label: ReactNode;
  /** Panel content shown when the tab is active. */
  readonly content: ReactNode;
}

/** Props for {@link Tabs}. */
export interface TabsProps {
  /** The tabs, in order. */
  readonly items: readonly TabItem[];
  /** Initially active value; defaults to the first item. */
  readonly defaultValue?: string;
  /** Controlled active value. */
  readonly value?: string;
  /** Called with the new active value. */
  readonly onValueChange?: (value: string) => void;
  /** Accessible name of the tab list (already translated). */
  readonly label: string;
  /** Reading direction; pass the page direction. */
  readonly dir?: "rtl" | "ltr";
  /** Extra classes for the root. */
  readonly className?: string;
}

/**
 * Renders a tab list with its panels.
 *
 * @param props - Items, value handlers and the list label.
 * @returns The tabs element.
 * @example
 * <Tabs label={t("client.sections")} items={[{ value: "info", label: t("client.info"), content: <Info /> }]} />
 */
export function Tabs({ items, defaultValue, label, className, ...rest }: Readonly<TabsProps>): ReactElement {
  return (
    <RadixTabs.Root
      defaultValue={rest.value === undefined ? (defaultValue ?? items[0]?.value) : undefined}
      className={cx("flex flex-col gap-4", className)}
      {...rest}
    >
      <RadixTabs.List aria-label={label} className="flex gap-1 overflow-x-auto border-b border-border">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cx(
              "min-h-11 shrink-0 border-b-2 border-transparent px-4 text-base font-semibold text-muted aria-selected:border-primary aria-selected:text-primary",
              FOCUS_RING,
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content
          key={item.value}
          value={item.value}
          className={cx("text-base text-text", FOCUS_RING)}
        >
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

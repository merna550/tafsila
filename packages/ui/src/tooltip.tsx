/** Tooltip: a short hint on hover or focus, built on Radix Tooltip (keyboard accessible). */
import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

/** Props for {@link Tooltip}. */
export interface TooltipProps {
  /** Hint text (already translated). */
  readonly content: ReactNode;
  /** The single focusable element the hint belongs to. */
  readonly children: ReactElement;
  /** Reading direction; pass the page direction. */
  readonly dir?: "rtl" | "ltr";
  /** Opens the hint on first render (used by stories and tests). */
  readonly defaultOpen?: boolean;
}

/**
 * Shows `content` when `children` is hovered or focused.
 *
 * @param props - Hint content and the trigger element.
 * @returns The wrapped trigger with its hint.
 * @example
 * <Tooltip content={t("client.call")}><IconButton label={t("client.call")}>...</IconButton></Tooltip>
 */
export function Tooltip({ content, children, dir, defaultOpen }: Readonly<TooltipProps>): ReactElement {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root defaultOpen={defaultOpen}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            dir={dir}
            sideOffset={6}
            className="z-overlay max-w-64 rounded-md bg-text px-3 py-1.5 text-sm text-surface shadow-md"
          >
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

/** Sheet: a panel that slides in from the start, end or bottom edge (drawer); same behaviour as {@link Dialog}. */
import type { ReactElement } from "react";
import { ModalFrame, type ModalProps } from "./modal-frame";

/** Edge a sheet attaches to; "start" and "end" follow the reading direction. */
export type SheetSide = "start" | "end" | "bottom";

/** Props for {@link Sheet}: the dialog props plus the edge. */
export interface SheetProps extends ModalProps {
  /** Edge to attach to; defaults to "end". */
  readonly side?: SheetSide;
}

/** Panel classes per edge (logical properties, so RTL mirrors automatically). */
export const SHEET_SIDE_CLASSES: Record<SheetSide, string> = {
  start: "inset-y-0 start-0 w-4/5 max-w-sm",
  end: "inset-y-0 end-0 w-4/5 max-w-sm",
  bottom: "inset-x-0 bottom-0 max-h-4/5 rounded-t-xl",
};

/**
 * Renders a drawer attached to one edge.
 *
 * @param props - Dialog props plus `side`.
 * @returns The sheet element.
 * @example
 * <Sheet side="start" trigger={<IconButton label={t("nav.open")}>...</IconButton>} title={t("nav.menu")} closeLabel={t("common.close")}>...</Sheet>
 */
export function Sheet({ side = "end", ...rest }: Readonly<SheetProps>): ReactElement {
  return <ModalFrame {...rest} panelClassName={SHEET_SIDE_CLASSES[side]} />;
}

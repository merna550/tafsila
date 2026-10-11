/** Dialog: a centred modal window (focus trapped, closes on Escape) built on Radix Dialog. */
import type { ReactElement } from "react";
import { ModalFrame, type ModalProps } from "./modal-frame";

/** Props for {@link Dialog}. */
export type DialogProps = ModalProps;

/** Centres the panel without physical-direction classes. */
const DIALOG_PANEL = "inset-0 m-auto h-fit max-h-11/12 w-11/12 max-w-md rounded-lg";

/**
 * Renders a centred modal dialog.
 *
 * @param props - Open state, title, close label, content and footer.
 * @returns The dialog element.
 * @example
 * <Dialog open={open} onOpenChange={setOpen} title={t("client.delete")} closeLabel={t("common.close")} footer={<Button variant="danger">{t("common.delete")}</Button>}>...</Dialog>
 */
export function Dialog(props: Readonly<DialogProps>): ReactElement {
  return <ModalFrame {...props} panelClassName={DIALOG_PANEL} />;
}

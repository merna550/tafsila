/** ModalFrame: the shared Radix Dialog structure behind {@link Dialog} and {@link Sheet} (overlay, title, close button, focus trap). */
import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactElement, ReactNode } from "react";
import { CloseIcon } from "./icons";
import { IconButton } from "./icon-button";
import { cx } from "./styles";

/** Props shared by every modal surface. */
export interface ModalProps {
  /** Controlled open state. */
  readonly open?: boolean;
  /** Called when the modal asks to open or close (Escape, overlay click, close button). */
  readonly onOpenChange?: (open: boolean) => void;
  /** Element that opens the modal; optional when `open` is controlled. */
  readonly trigger?: ReactElement;
  /** Heading (already translated); announced as the modal's name. */
  readonly title: ReactNode;
  /** Optional explanation announced after the title. */
  readonly description?: ReactNode;
  /** Accessible label of the close button (already translated). */
  readonly closeLabel: string;
  /** Body content. */
  readonly children?: ReactNode;
  /** Optional footer slot, for example action buttons. */
  readonly footer?: ReactNode;
  /** Reading direction; pass the page direction. */
  readonly dir?: "rtl" | "ltr";
}

/** Props for {@link ModalFrame}: the shared props plus the classes that place the panel. */
export interface ModalFrameProps extends ModalProps {
  /** Classes that position and size the panel. */
  readonly panelClassName: string;
}

/**
 * Renders a modal with an overlay, a labelled panel and a close button.
 *
 * @param props - Shared modal props and the panel classes.
 * @returns The modal element; focus is trapped and Escape closes it.
 */
export function ModalFrame({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  closeLabel,
  children,
  footer,
  dir,
  panelClassName,
}: Readonly<ModalFrameProps>): ReactElement {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-overlay bg-text/50" />
        <RadixDialog.Content
          dir={dir}
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cx(
            "fixed z-modal flex flex-col gap-4 overflow-y-auto bg-surface p-5 shadow-lg",
            panelClassName,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <RadixDialog.Title className="text-xl font-bold text-text">{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton label={closeLabel} variant="ghost">
                <CloseIcon className="size-5" />
              </IconButton>
            </RadixDialog.Close>
          </div>
          {description ? (
            <RadixDialog.Description className="text-base text-muted">{description}</RadixDialog.Description>
          ) : null}
          <div className="text-base text-text">{children}</div>
          {footer ? <div className="flex flex-wrap items-center justify-end gap-2">{footer}</div> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

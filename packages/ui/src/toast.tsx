"use client";
/** Toast system: `ToastProvider` once near the root, then `useToast().showToast(...)` from any component (Radix Toast; announced to screen readers). */
import * as RadixToast from "@radix-ui/react-toast";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { CloseIcon } from "./icons";
import { cx } from "./styles";

/** Meaning of a toast; "danger" is used for failed actions (ADR-030). */
export type ToastTone = "success" | "info" | "warning" | "danger";

/** What `showToast` needs. */
export interface ToastMessage {
  /** Short text (already translated). */
  readonly title: ReactNode;
  /** Optional detail line. */
  readonly description?: ReactNode;
  /** Colour meaning; defaults to "info". */
  readonly tone?: ToastTone;
}

/** The API handed out by {@link useToast}. */
export interface ToastApi {
  /** Shows a toast that closes itself after a few seconds. */
  readonly showToast: (message: ToastMessage) => void;
}

/** A toast waiting on screen. */
interface ActiveToast extends ToastMessage {
  readonly id: number;
}

/** Props for {@link ToastProvider}. */
export interface ToastProviderProps {
  /** The app. */
  readonly children: ReactNode;
  /** Accessible label of each toast's close button (already translated). */
  readonly closeLabel: string;
  /** Accessible name of the notifications region (already translated). */
  readonly regionLabel: string;
  /** Reading direction; pass the page direction. */
  readonly dir?: "rtl" | "ltr";
}

/** Border colour per tone. */
export const TOAST_TONE_CLASSES: Record<ToastTone, string> = {
  success: "border-success",
  info: "border-info",
  warning: "border-warning",
  danger: "border-danger",
};

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Provides `showToast` to the tree and renders the toast stack.
 *
 * @param props - App content, labels and direction.
 * @returns The provider with the viewport.
 * @example
 * <ToastProvider closeLabel={t("common.close")} regionLabel={t("toast.region")}>{children}</ToastProvider>
 */
export function ToastProvider({
  children,
  closeLabel,
  regionLabel,
  dir,
}: Readonly<ToastProviderProps>): ReactElement {
  const [toasts, setToasts] = useState<readonly ActiveToast[]>([]);
  const showToast = useCallback((message: ToastMessage): void => {
    setToasts((current) => [...current, { ...message, id: Date.now() + current.length }]);
  }, []);
  /**
   * Drops a closed toast from the stack.
   *
   * @param id - Id of the toast that closed.
   */
  const remove = (id: number): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };
  const api = useMemo<ToastApi>(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider swipeDirection={dir === "ltr" ? "right" : "left"} label={regionLabel}>
        {children}
        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            dir={dir}
            onOpenChange={(open) => (open ? undefined : remove(toast.id))}
            className={cx(
              "flex items-start gap-3 rounded-lg border-2 bg-surface p-4 shadow-lg",
              TOAST_TONE_CLASSES[toast.tone ?? "info"],
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <RadixToast.Title className="text-base font-semibold text-text">{toast.title}</RadixToast.Title>
              {toast.description ? (
                <RadixToast.Description className="text-sm text-muted">
                  {toast.description}
                </RadixToast.Description>
              ) : null}
            </div>
            <RadixToast.Close
              aria-label={closeLabel}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
            >
              <CloseIcon className="size-5" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed inset-x-0 bottom-0 z-toast m-0 flex list-none flex-col gap-2 p-4 sm:start-auto sm:end-0 sm:w-96" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

/**
 * Returns the toast API; must be used under a {@link ToastProvider}.
 *
 * @returns The toast API.
 * @throws {Error} When no provider is above the caller.
 * @example
 * const { showToast } = useToast();
 * showToast({ title: t("client.saved"), tone: "success" });
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}

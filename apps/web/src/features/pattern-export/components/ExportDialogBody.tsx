"use client";
/** The body and footer of the export dialog for each state: choose, running, done, error (issue #289). Props in, markup out. */
import { Button } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import type { ApiError } from "@/shared/api";
import type { ExportKind, ExportState } from "@/shared/pattern-export";
import { ExportInstructions } from "./ExportInstructions";
import { ExportOptionList } from "./ExportOptionList";
import { ExportProgress } from "./ExportProgress";

/** Props of {@link ExportDialogBody}. */
export interface ExportDialogBodyProps {
  /** Where the export is. */
  readonly state: ExportState;
  /** The chosen kind. */
  readonly kind: ExportKind;
  /** Called when another kind is chosen. */
  readonly onKindChange: (kind: ExportKind) => void;
  /** Starts the build. */
  readonly onStart: () => void;
  /** Stops a running build. */
  readonly onCancel: () => void;
  /** Closes the dialog. */
  readonly onClose: () => void;
  /** Downloads the finished file again. */
  readonly onDownloadAgain: () => void;
}

/** What the dialog shows in one state. */
interface Panel {
  /** The content above the buttons. */
  readonly content: ReactNode;
  /** The buttons. */
  readonly buttons: ReactNode;
}

/**
 * Builds the panel of the done state.
 *
 * @param props - The dialog props; `state` is the done state.
 * @param t - Translator of `patternExport`.
 * @returns The panel.
 */
function donePanel(
  props: ExportDialogBodyProps,
  t: ReturnType<typeof useTranslations<"patternExport">>,
): Panel {
  const state = props.state as Extract<ExportState, { status: "done" }>;
  const pages = state.file.pageCount;
  return {
    content: (
      <>
        <p
          role="status"
          data-testid="export-done"
          className="rounded-md border border-primary bg-primary-soft px-3.5 py-2.5 text-base text-text"
        >
          {pages === null ? t("done.svg") : t("done.pdf", { pages })}
        </p>
        {pages === null ? null : <ExportInstructions />}
      </>
    ),
    buttons: (
      <>
        <Button variant="secondary" onClick={props.onClose}>
          {t("close")}
        </Button>
        <Button onClick={props.onDownloadAgain} data-testid="export-download-again">
          {t("downloadAgain")}
        </Button>
      </>
    ),
  };
}

/**
 * Builds the panel of the error state.
 *
 * @param props - The dialog props.
 * @param error - The failure to show.
 * @param t - Translator of `patternExport`.
 * @param locale - Message language.
 * @returns The panel.
 */
function errorPanel(
  props: ExportDialogBodyProps,
  error: ApiError,
  t: ReturnType<typeof useTranslations<"patternExport">>,
  locale: string,
): Panel {
  return {
    content: (
      <p
        role="alert"
        data-testid="export-error"
        className="rounded-md border border-danger bg-accent-soft px-3.5 py-2.5 text-base text-text"
      >
        {error.localizedMessage(locale === "ar" ? "ar" : "en")}
      </p>
    ),
    buttons: (
      <>
        <Button variant="secondary" onClick={props.onClose}>
          {t("close")}
        </Button>
        <Button onClick={props.onStart} data-testid="export-retry">
          {t("tryAgain")}
        </Button>
      </>
    ),
  };
}

/**
 * Picks what to show for the state.
 *
 * @param props - The dialog props.
 * @param t - Translator of `patternExport`.
 * @param locale - Message language.
 * @returns The panel.
 */
function panelFor(
  props: ExportDialogBodyProps,
  t: ReturnType<typeof useTranslations<"patternExport">>,
  locale: string,
): Panel {
  const { state } = props;
  if (state.status === "running") {
    return {
      content: <ExportProgress progress={state.progress} />,
      buttons: (
        <Button variant="secondary" onClick={props.onCancel} data-testid="export-cancel">
          {t("cancel")}
        </Button>
      ),
    };
  }
  if (state.status === "done") return donePanel(props, t);
  if (state.status === "error") return errorPanel(props, state.error, t, locale);
  return {
    content: (
      <>
        <ExportOptionList value={props.kind} onChange={props.onKindChange} disabled={false} />
        <ExportInstructions />
      </>
    ),
    buttons: (
      <>
        <Button variant="secondary" onClick={props.onClose}>
          {t("cancel")}
        </Button>
        <Button onClick={props.onStart} data-testid="export-start">
          {t("export")}
        </Button>
      </>
    ),
  };
}

/**
 * Renders the content and the buttons for the current state.
 *
 * @param props - State, chosen kind and handlers.
 * @returns The content followed by the button row.
 */
export function ExportDialogBody(props: Readonly<ExportDialogBodyProps>): ReactElement {
  const t = useTranslations("patternExport");
  const locale = useLocale();
  const panel = panelFor(props, t, locale);
  return (
    <div className="flex flex-col gap-4">
      {panel.content}
      <div className="flex flex-wrap justify-end gap-2">{panel.buttons}</div>
    </div>
  );
}

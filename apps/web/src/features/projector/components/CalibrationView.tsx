"use client";
/** The calibration page, drawn from props: the black stage, the square to measure, the two size fields and the result (issue #285). */
import { Button, Input } from "@tafsila/ui";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type {
  CalibrationErrorKey,
  CalibrationFormController,
  FullscreenController,
} from "../model/controllers";
import { nominalSquarePx } from "../model/calibration";
import type { CalibrationState } from "../model/calibration-store";
import type { ScreenInfo } from "../projector.schema";
import { FullscreenButton } from "./FullscreenButton";
import { LINK_BUTTON } from "./link-button";
import { Link } from "@/shared/i18n";

/** Props of {@link CalibrationView}. */
export interface CalibrationViewProps {
  /** Where "Back" goes (the version view). */
  readonly backHref: string;
  /** Where "Open the projector" goes. */
  readonly openHref: string;
  /** What is known about this device. */
  readonly state: CalibrationState;
  /** The screen now, or null before mount. */
  readonly screen: ScreenInfo | null;
  /** True after "Calibrate again": the form shows even though a calibration is stored. */
  readonly redoing: boolean;
  /** Starts a new calibration. */
  readonly onRedo: () => void;
  /** The form fields. */
  readonly form: CalibrationFormController;
  /** Fullscreen controls. */
  readonly fullscreen: FullscreenController;
  /** Called when the form is sent. */
  readonly onSubmit: () => void;
}

/**
 * One size field with its unit and error text.
 *
 * @param props - Label, value, change handler and error key.
 * @returns The field.
 */
function SizeField(
  props: Readonly<{
    label: string;
    value: string;
    onChange: (text: string) => void;
    error: CalibrationErrorKey | null;
    name: string;
  }>,
): ReactElement {
  const t = useTranslations("projector.calibrate");
  const { label, value, onChange, error, name } = props;
  return (
    <div className="flex flex-1 basis-40 flex-col gap-1.5">
      <label htmlFor={`size-${name}`} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={`size-${name}`}
          name={name}
          value={value}
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={error !== null}
          aria-describedby={error ? `size-${name}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="text-sm">{t("unit")}</span>
      </div>
      {error ? (
        <p id={`size-${name}-error`} role="alert" className="text-xs text-saffron">
          {t(`errors.${error}`)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The steps and the two fields.
 *
 * @param props - The form, its submit and the stale hint flag.
 * @returns The form card.
 */
function MeasureForm(
  props: Readonly<{ form: CalibrationFormController; onSubmit: () => void; stale: boolean }>,
): ReactElement {
  const t = useTranslations("projector.calibrate");
  const { form } = props;
  /**
   * Sends the form without a page reload.
   *
   * @param event - The submit event.
   * @param event.preventDefault - Stops the browser's own submit.
   */
  const send = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    props.onSubmit();
  };
  return (
    <form onSubmit={send} className="flex flex-col gap-4" noValidate>
      {props.stale ? <p className="text-sm text-saffron">{t("stale")}</p> : null}
      <ol className="ps-5 text-sm">
        <li>{t("steps.show")}</li>
        <li>{t("steps.measure")}</li>
        <li>{t("steps.type")}</li>
      </ol>
      <p className="text-xs text-line">{t("zoomHint")}</p>
      <div className="flex flex-wrap gap-3">
        <SizeField
          name="width"
          label={t("width")}
          value={form.width}
          onChange={form.setWidth}
          error={form.widthError}
        />
        <SizeField
          name="height"
          label={t("height")}
          value={form.height}
          onChange={form.setHeight}
          error={form.heightError}
        />
      </div>
      {form.storageError ? (
        <p role="alert" className="text-xs text-saffron">
          {t("errors.storage")}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={form.width.trim() === "" || form.height.trim() === ""}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}

/**
 * The saved result with the two ways on.
 *
 * @param props - The state, links and the redo action.
 * @returns The result card.
 */
function Result(
  props: Readonly<{ state: CalibrationState; openHref: string; onRedo: () => void }>,
): ReactElement | null {
  const t = useTranslations("projector.calibrate");
  const format = useFormatter();
  const c = props.state.calibration;
  if (c === null) return null;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">{t("done")}</h2>
      <p className="text-sm">
        {t("factorX", { value: c.pxPerMmX.toFixed(2) })}
        <br />
        {t("factorY", { value: c.pxPerMmY.toFixed(2) })}
        <br />
        {t("details", {
          width: c.screen.widthPx,
          height: c.screen.heightPx,
          date: format.dateTime(new Date(c.calibratedAt), { dateStyle: "medium" }),
        })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href={props.openHref} className={`${LINK_BUTTON} bg-primary text-on-primary`}>
          {t("open")}
        </Link>
        <Button variant="secondary" onClick={props.onRedo}>
          {t("redo")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Renders the whole calibration page over the app chrome.
 *
 * @param props - See {@link CalibrationViewProps}.
 * @returns The page.
 */
export function CalibrationView(props: Readonly<CalibrationViewProps>): ReactElement {
  const t = useTranslations("projector.calibrate");
  const { state, screen } = props;
  const showResult = state.status === "ok" && !props.redoing;
  return (
    <div className="fixed inset-0 z-modal overflow-auto bg-stage text-surface">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <div className="flex items-center gap-3">
            <FullscreenButton fullscreen={props.fullscreen} />
            <Link href={props.backHref} className="text-sm font-semibold underline">
              {t("back")}
            </Link>
          </div>
        </div>
        {screen === null ? (
          <p role="status">{t("loading")}</p>
        ) : (
          <div className="flex flex-wrap items-start gap-5">
            <div className="min-w-0 flex-1 basis-96 rounded-lg border border-dashed border-muted px-4 py-8">
              <div dir="ltr" className="mx-auto">
                <div
                  data-testid="calibration-square"
                  className="relative mx-auto bg-surface"
                  style={{ width: nominalSquarePx(screen), height: nominalSquarePx(screen) }}
                >
                  <span aria-hidden className="absolute inset-y-0 start-1/2 w-px bg-stage" />
                  <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-stage" />
                </div>
              </div>
            </div>
            <div className="flex-1 basis-80 rounded-lg border border-muted bg-text p-5">
              {showResult ? (
                <Result state={state} openHref={props.openHref} onRedo={props.onRedo} />
              ) : (
                <MeasureForm form={props.form} onSubmit={props.onSubmit} stale={state.status === "stale"} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

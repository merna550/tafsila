/** One measurement box: label, "how do I measure?" link, cm input, "adjusted" badge with reset link, and the error or warning line. */
import { useTranslations } from "next-intl";
import { useId, type InputHTMLAttributes, type ReactElement } from "react";
import type { MeasurementField as FieldKey } from "../model/field-groups";

/** Props for {@link MeasurementField}. */
export interface MeasurementFieldProps {
  /** Which measurement this is. */
  readonly field: FieldKey;
  /** Props from React Hook Form's `register` (name, ref, onChange, onBlur). */
  readonly inputProps: InputHTMLAttributes<HTMLInputElement>;
  /** Error text under the box (blocks saving), if any. */
  readonly error?: string;
  /** Warning text under the box (does not block), if any. */
  readonly warning?: string;
  /** True when the value differs from the picked size. */
  readonly changed: boolean;
  /** The size and its value as text, shown in the reset link. */
  readonly baseValue: { readonly size: string; readonly cm: string };
  /** Puts the size's value back. */
  readonly onReset: () => void;
  /** Opens the guide for this field. */
  readonly onGuide: () => void;
}

/** Border and background of the box for each state. */
const STATE_CLASSES = {
  error: "border-danger",
  warning: "border-warning bg-accent-soft",
  ok: "border-border",
} as const;

/**
 * Picks the look of the box.
 *
 * @param error - Error text, if any.
 * @param warning - Warning text, if any.
 * @returns The state key.
 */
function boxState(error: string | undefined, warning: string | undefined): keyof typeof STATE_CLASSES {
  if (error) return "error";
  return warning ? "warning" : "ok";
}

/**
 * Renders the box with its helpers.
 *
 * @param props - Field, register props, messages and handlers.
 * @returns The field block.
 */
export function MeasurementField(props: Readonly<MeasurementFieldProps>): ReactElement {
  const { field, inputProps, error, warning, changed, baseValue, onReset, onGuide } = props;
  const t = useTranslations("measurements");
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? warning;
  const state = boxState(error, warning);
  const label = t(`labels.${field}`);
  const linkClass = "min-h-11 text-sm font-semibold text-primary underline";
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <label htmlFor={id} className="text-sm font-semibold text-text">
          {label}
          {changed ? (
            <span className="ms-1 text-xs font-normal text-accent">· {t("field.adjusted")}</span>
          ) : null}
        </label>
        <button
          type="button"
          onClick={onGuide}
          className={linkClass}
          aria-label={`${t("field.guide")} ${label}`}
        >
          {t("field.guide")}
        </button>
      </div>
      {changed && baseValue ? (
        <button type="button" onClick={onReset} className={`${linkClass} self-start`}>
          {t("field.reset", { size: baseValue.size, value: baseValue.cm })}
        </button>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          className={`min-h-11 w-full min-w-0 rounded-md border bg-surface px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-focus ${STATE_CLASSES[state]}`}
          {...inputProps}
        />
        <span className="shrink-0 text-sm text-muted">{t("unit")}</span>
      </div>
      {message ? (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={`text-sm ${error ? "font-semibold text-danger" : "text-warning"}`}
        >
          <span className="sr-only">{error ? t("field.error") : t("field.warning")}: </span>
          {message}
        </p>
      ) : null}
    </div>
  );
}

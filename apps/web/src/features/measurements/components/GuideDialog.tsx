/** The "how do I measure?" dialog: illustration, numbered steps, a warning box, "got it" and "next measurement". */
import { Button, Dialog } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { MeasurementField } from "../model/field-groups";
import { GuideIllustration } from "./GuideIllustration";

/** Props for {@link GuideBody}. */
interface GuideBodyProps {
  /** The measurement explained. */
  readonly field: MeasurementField;
}

/** Props for {@link GuideDialog}. */
interface GuideDialogProps {
  /** The measurement explained, or undefined when closed. */
  readonly field: MeasurementField | undefined;
  /** The next measurement, or undefined for the last one. */
  readonly next: MeasurementField | undefined;
  /** Closes the dialog. */
  readonly onClose: () => void;
  /** Moves to the next measurement. */
  readonly onNext: (field: MeasurementField) => void;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the content: the drawing, the steps and the warning.
 *
 * @param props - The measurement.
 * @returns The content.
 */
export function GuideBody({ field }: Readonly<GuideBodyProps>): ReactElement {
  const t = useTranslations("measurements");
  const steps = t.raw(`guide.${field}.steps`) as string[];
  return (
    <div className="grid gap-4 sm:grid-cols-5">
      <div className="flex items-center justify-center rounded-md bg-surface-hover p-3 sm:col-span-2">
        <GuideIllustration field={field} label={t("guide.illustration")} />
      </div>
      <div className="flex flex-col gap-3 sm:col-span-3">
        <ol className="list-decimal space-y-2 ps-5 text-base text-text">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="rounded-md bg-accent-soft p-3 text-sm text-text">
          <strong className="text-accent">{t("field.warning")}: </strong>
          {t(`guide.${field}.warning`)}
        </p>
      </div>
    </div>
  );
}

/**
 * Renders the dialog; it is open while a field is set.
 *
 * @param props - Field, next field and handlers.
 * @returns The dialog.
 */
export function GuideDialog({ field, next, onClose, onNext, dir }: Readonly<GuideDialogProps>): ReactElement {
  const t = useTranslations("measurements");
  return (
    <Dialog
      open={field !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      dir={dir}
      title={field ? t("field.guideFor", { field: t(`labels.${field}`) }) : ""}
      closeLabel={t("guide.close")}
      footer={
        <div className="flex flex-wrap gap-2">
          <Button onClick={onClose}>{t("guide.done")}</Button>
          {next ? (
            <Button variant="secondary" onClick={() => onNext(next)}>
              {t("guide.next")}
            </Button>
          ) : null}
        </div>
      }
    >
      {field ? <GuideBody field={field} /> : null}
    </Dialog>
  );
}

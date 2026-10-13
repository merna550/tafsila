/** Confirmation dialog for deleting the account: lists what is removed and asks to type the confirmation word. */
import { Button, Dialog, FormField, Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import type { AppLocale } from "@/shared/i18n";
import { DELETE_WORDS, matchesDeleteWord } from "../model/delete-word";

/** Props for {@link DeleteAccountDialog}. */
interface DeleteAccountDialogProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called when it asks to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /** Runs the deletion. */
  readonly onConfirm: () => void;
  /** True while deleting. */
  readonly pending: boolean;
  /** Page language, which decides the confirmation word and the direction. */
  readonly locale: AppLocale;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the dialog. The confirm button stays disabled until the exact word is typed.
 *
 * @param props - Open state, handlers and language.
 * @returns The dialog.
 */
export function DeleteAccountDialog(props: Readonly<DeleteAccountDialogProps>): ReactElement {
  const { open, onOpenChange, onConfirm, pending, locale, dir } = props;
  const t = useTranslations("deleteAccount");
  const [typed, setTyped] = useState("");
  const ready = matchesDeleteWord(typed, locale) && !pending;
  /**
   * Closes or opens the dialog; the typed text is cleared on every change so a reopened dialog starts empty.
   *
   * @param next - Requested open state.
   */
  const change = (next: boolean): void => {
    setTyped("");
    onOpenChange(next);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={change}
      dir={dir}
      title={t("dialogTitle")}
      closeLabel={t("close")}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => change(false)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={!ready}>
            {t("confirm")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p>{t("dialogIntro")}</p>
        <ul className="list-disc ps-6">
          <li>{t("items.clients")}</li>
          <li>{t("items.photos")}</li>
          <li>{t("items.profile")}</li>
        </ul>
        <p className="text-muted">{t("trialNote")}</p>
        <FormField label={t("typeLabel", { word: DELETE_WORDS[locale] })}>
          {(control) => (
            <Input
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              {...control}
            />
          )}
        </FormField>
      </div>
    </Dialog>
  );
}

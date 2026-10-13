/** The "My account" card: name field with an explicit save button and the read-only phone row. */
import type { PhoneStatusResponse } from "@tafsila/schemas";
import { Button, FormField, Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { UseFormReturn } from "react-hook-form";
import { isNameErrorKey, type ProfileFormValues } from "../model/profile-form.schema";
import { PhoneRow } from "./PhoneRow";

/** Props for {@link AccountCard}. */
interface AccountCardProps {
  /** The name form from `useProfileForm`. */
  readonly form: UseFormReturn<ProfileFormValues>;
  /** Submit handler. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** True while saving. */
  readonly pending: boolean;
  /** True when the name differs from the saved one. */
  readonly changed: boolean;
  /** Phone status, or undefined while it loads or when it could not be read (the row is then left out). */
  readonly phone: PhoneStatusResponse | undefined;
}

/**
 * Renders the account card.
 *
 * @param props - Form, handlers and phone status.
 * @returns The card.
 */
export function AccountCard(props: Readonly<AccountCardProps>): ReactElement {
  const { form, onSubmit, pending, changed, phone } = props;
  const t = useTranslations("settings.account");
  const message = form.formState.errors.name?.message;
  const error = message !== undefined && isNameErrorKey(message) ? t(message) : message;
  return (
    <section
      aria-labelledby="settings-account"
      className="flex flex-col gap-4 rounded-lg bg-surface p-6 shadow-card"
    >
      <h2 id="settings-account" className="text-xl font-semibold text-text">
        {t("title")}
      </h2>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <FormField label={t("name")} error={error}>
          {(control) => <Input autoComplete="name" {...control} {...form.register("name")} />}
        </FormField>
        <div>
          <Button type="submit" disabled={!changed || pending}>
            {t("save")}
          </Button>
        </div>
      </form>
      {phone ? <PhoneRow status={phone} /> : null}
    </section>
  );
}

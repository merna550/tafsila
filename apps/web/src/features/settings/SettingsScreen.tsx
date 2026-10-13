"use client";
/** The /settings screen: account (name, phone), display (language, units), delete account and sign out. */
import type { Profile } from "@tafsila/schemas";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { DataState } from "@/shared/data-state";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { SignOut } from "../auth";
import { AccountCard } from "./components/AccountCard";
import { DeleteAccountCard } from "./components/DeleteAccountCard";
import { DeleteAccountDialog } from "./components/DeleteAccountDialog";
import { DisplayCard } from "./components/DisplayCard";
import { useDeleteAccount } from "./hooks/use-delete-account";
import { usePhone, useProfile } from "./hooks/use-profile";
import { useProfileForm } from "./hooks/use-profile-form";
import { useSwitchLanguage } from "./hooks/use-switch-language";

/**
 * Shows the cards once the profile has loaded.
 *
 * @param props - The loaded profile.
 * @param props.profile - The profile.
 * @returns The cards.
 */
function SettingsContent({ profile }: Readonly<{ profile: Profile }>): ReactElement {
  const locale = useLocale() as AppLocale;
  const [deleting, setDeleting] = useState(false);
  const { form, onSubmit, pending, changed } = useProfileForm(profile);
  const phone = usePhone();
  const language = useSwitchLanguage();
  const remove = useDeleteAccount();
  return (
    <>
      <AccountCard form={form} onSubmit={onSubmit} pending={pending} changed={changed} phone={phone.data} />
      <DisplayCard current={language.current} onSelect={language.switchTo} />
      <DeleteAccountCard onOpen={() => setDeleting(true)} />
      <DeleteAccountDialog
        open={deleting}
        onOpenChange={setDeleting}
        onConfirm={() => void remove.confirm().then((done) => (done ? undefined : setDeleting(false)))}
        pending={remove.pending}
        locale={locale}
        dir={DIRECTION[locale]}
      />
    </>
  );
}

/**
 * Loads the profile and renders the screen.
 *
 * @returns The screen.
 */
export function SettingsScreen(): ReactElement {
  const t = useTranslations("settings");
  const profile = useProfile();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-semibold text-text">{t("title")}</h1>
      <DataState
        isPending={profile.isPending}
        error={profile.error}
        isEmpty={false}
        onRetry={() => void profile.refetch()}
      >
        {profile.data ? <SettingsContent profile={profile.data} /> : null}
      </DataState>
      <div>
        <SignOut />
      </div>
    </main>
  );
}

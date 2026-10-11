/** Placeholder dashboard: proves the guard and the session; the real dashboard comes later. */
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { SignOut } from "@/features/auth";

/**
 * Renders the welcome text and the sign-out button.
 *
 * @returns The page.
 */
export default async function DashboardPage(): Promise<ReactElement> {
  const t = await getTranslations("dashboard");
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-lg leading-8">{t("welcome")}</p>
      <SignOut />
    </div>
  );
}

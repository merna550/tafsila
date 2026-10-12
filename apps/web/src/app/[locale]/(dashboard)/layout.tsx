/** Layout of signed-in pages: a server-side session check, the second line of defence behind the proxy guard. */
import type { ReactElement, ReactNode } from "react";
import { redirect } from "@/shared/i18n";
import { getLocale } from "next-intl/server";
import { getSessionUser } from "@/shared/auth/server";
import { AppNav } from "@/shared/layout";

/**
 * Sends signed-out visitors to sign-in and renders the page for everyone else.
 *
 * @param props - The page.
 * @param props.children - Page to render.
 * @returns The page.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>): Promise<ReactElement> {
  const user = await getSessionUser();
  if (!user) redirect({ href: "/sign-in?next=%2Fdashboard", locale: await getLocale() });
  const initial = (user?.email ?? "").trim().charAt(0).toUpperCase();
  return (
    <>
      <AppNav initial={initial} />
      <div className="px-4 py-6">{children}</div>
    </>
  );
}

/** Layout of the projector pages: a server-side session check and nothing else, so the page has no app navigation (issue #285). */
import type { ReactElement, ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { getSessionUser } from "@/shared/auth/server";
import { redirect } from "@/shared/i18n";

/**
 * Sends signed-out visitors to sign-in and renders the page for everyone else.
 *
 * @param props - The page.
 * @param props.children - Page to render.
 * @returns The page.
 */
export default async function ProjectorLayout({
  children,
}: Readonly<{ children: ReactNode }>): Promise<ReactElement> {
  const user = await getSessionUser();
  if (!user) redirect({ href: "/sign-in?next=%2Fdashboard", locale: await getLocale() });
  return <>{children}</>;
}

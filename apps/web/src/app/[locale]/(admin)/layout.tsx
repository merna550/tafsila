/** Layout of the admin area: signed-in admins only. Everyone else gets the 404 page, so the area is not advertised. */
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { AdminFrame } from "@/features/admin-shell";
import { getSessionRole, getSessionUser } from "@/shared/auth/server";
import { redirect } from "@/shared/i18n";
import { AppNav } from "@/shared/layout";

/**
 * Sends signed-out visitors to sign-in, answers 404 to signed-in non-admins and renders the page for admins.
 * The role comes from the session token (up to an hour old); the API and the database check it again.
 *
 * @param props - The page.
 * @param props.children - Page to render.
 * @returns The page inside the admin frame.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>): Promise<ReactElement> {
  const user = await getSessionUser();
  if (!user) redirect({ href: "/sign-in?next=%2Fadmin%2Fusers", locale: await getLocale() });
  if ((await getSessionRole()) !== "admin") notFound();
  const initial = (user?.email ?? "").trim().charAt(0).toUpperCase();
  return (
    <>
      <AppNav initial={initial} isAdmin />
      <div className="px-4 py-6">
        <AdminFrame>{children}</AdminFrame>
      </div>
    </>
  );
}

/** /admin has no page of its own: it opens the users list. */
import { getLocale } from "next-intl/server";
import { redirect } from "@/shared/i18n";

/**
 * Redirects to the users list.
 *
 * @returns Never returns; the redirect ends the request.
 */
export default async function AdminIndexPage(): Promise<never> {
  return redirect({ href: "/admin/users", locale: await getLocale() });
}

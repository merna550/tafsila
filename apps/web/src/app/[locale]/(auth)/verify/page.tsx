/** Verify-phone screen (FR-AUTH-02): a signed-in person confirms their Egyptian mobile number with a one-time code. */
import { redirect } from "@/shared/i18n";
import { getLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { DEFAULT_AFTER_SIGN_IN, sanitizeNext } from "@/shared/auth";
import { getSessionUser } from "@/shared/auth/server";
import { VerifyPhone } from "@/features/verify-phone";

/** Query string of the page: `next` is where to go afterwards. */
interface VerifyPageProps {
  readonly searchParams: Promise<{ next?: string | string[] }>;
}

/**
 * Renders the screen for a signed-in person; signed-out visitors go to sign-in (the proxy guard does this first).
 *
 * @param props - The page props.
 * @param props.searchParams - Query string, read for the same-site `next` path.
 * @returns The page.
 */
export default async function VerifyPage({ searchParams }: Readonly<VerifyPageProps>): Promise<ReactElement> {
  const user = await getSessionUser();
  const { next } = await searchParams;
  if (!user) redirect({ href: "/sign-in?next=%2Fverify", locale: await getLocale() });
  return <VerifyPhone next={sanitizeNext(typeof next === "string" ? next : null) ?? DEFAULT_AFTER_SIGN_IN} />;
}

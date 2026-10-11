/** Sign-in screen (FR-AUTH-01): email and password, optional Google, `next` kept through the round trip. */
import { loadPublicConfig } from "@tafsila/config";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { AuthCard, AuthTabs, GoogleButton, SignInForm } from "@/features/auth";

/** Query of the page: `next` is where to go after signing in, `error=link` means an email link failed. */
interface SignInPageProps {
  /** Raw query values. */
  readonly searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
}

/**
 * Takes the first value of a query parameter.
 *
 * @param value - A string, a list or nothing.
 * @returns The first string, or null.
 */
function first(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

/**
 * Renders the sign-in screen.
 *
 * @param props - The query.
 * @returns The card.
 */
export default async function SignInPage({ searchParams }: Readonly<SignInPageProps>): Promise<ReactElement> {
  const query = await searchParams;
  const next = first(query.next);
  const t = await getTranslations("authErrors");
  const initialError = first(query.error) === "link" ? t("linkInvalid") : null;
  return (
    <AuthCard>
      <AuthTabs active="signIn" />
      <SignInForm next={next} initialError={initialError} />
      {loadPublicConfig().authGoogleEnabled ? <GoogleButton next={next} /> : null}
    </AuthCard>
  );
}

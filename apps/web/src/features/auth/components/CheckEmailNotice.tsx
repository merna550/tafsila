/** "Check your email" notice shown after sign-up and after a reset request. Never says whether the address already had an account. */
import { Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link CheckEmailNotice}. */
interface CheckEmailNoticeProps {
  /** Address the mail was sent to. */
  readonly email: string;
  /** Which flow sent it. */
  readonly kind: "confirm" | "reset";
}

/**
 * Renders the notice with a link back to sign-in.
 *
 * @param props - The address and the flow.
 * @returns The notice.
 */
export function CheckEmailNotice({ email, kind }: Readonly<CheckEmailNoticeProps>): ReactElement {
  const t = useTranslations("auth.checkEmail");
  return (
    <div role="status" className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="leading-7">{t(kind === "confirm" ? "body" : "resetBody", { email })}</p>
      <UiLink asChild className="self-start">
        <Link href="/sign-in">{t("back")}</Link>
      </UiLink>
    </div>
  );
}

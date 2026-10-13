/** Read-only phone row: the number (always left-to-right) with a verified tick, or a link to verify it. */
import type { PhoneStatusResponse } from "@tafsila/schemas";
import { CheckIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import { internationalPhone } from "../model/phone-view";

/** Props for {@link PhoneRow}. */
interface PhoneRowProps {
  /** The phone status from GET /api/phone. */
  readonly status: PhoneStatusResponse;
}

/**
 * Renders the phone row.
 *
 * @param props - The phone status.
 * @returns The row.
 */
export function PhoneRow({ status }: Readonly<PhoneRowProps>): ReactElement {
  const t = useTranslations("settings.phone");
  const verified = status.verified && status.phone !== null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-bg px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-text">{t("label")}</div>
        <div dir="ltr" className="text-start text-lg text-text">
          {status.phone ? internationalPhone(status.phone) : t("none")}
        </div>
      </div>
      {verified ? (
        <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <CheckIcon className="size-4" />
          {t("verified")}
        </span>
      ) : (
        <span className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-muted">{t("notVerified")}</span>
          <Link href="/verify" className="inline-flex min-h-11 items-center text-primary underline">
            {t("verify")}
          </Link>
        </span>
      )}
    </div>
  );
}

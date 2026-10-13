/** A phone number (always left-to-right) with its verified badge. */
import { Badge } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Shown when a value is missing. */
export const EMPTY_CELL = "—";

/** Props for {@link PhoneCell}. */
interface PhoneCellProps {
  /** The phone number, or null. */
  readonly phone: string | null;
  /** True when it is verified. */
  readonly verified: boolean;
}

/**
 * Renders the number and a badge "verified" or "not verified"; a user without a phone shows a dash and no badge.
 *
 * @param props - Phone and verified flag.
 * @returns The cell content.
 */
export function PhoneCell({ phone, verified }: Readonly<PhoneCellProps>): ReactElement {
  const t = useTranslations("admin.users.phone");
  if (!phone) return <span className="text-muted">{EMPTY_CELL}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span dir="ltr">{phone}</span>
      <Badge tone={verified ? "success" : "warning"}>{verified ? t("verified") : t("unverified")}</Badge>
    </span>
  );
}

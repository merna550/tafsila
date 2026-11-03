/** Breadcrumb of the confirmation screen: My designs / Pattern from a photo / Confirm features. */
import { Breadcrumb, Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/**
 * Renders the breadcrumb; "Pattern from a photo" links back to the photos.
 *
 * @returns The breadcrumb.
 */
export function ConfirmBreadcrumb(): ReactElement {
  const t = useTranslations("confirmDesign");
  /**
   * Builds one linked breadcrumb item.
   *
   * @param href - The target.
   * @param text - The link text.
   * @returns The link.
   */
  const link = (href: string, text: string): ReactElement => (
    <UiLink asChild>
      <Link href={href} className="font-semibold">
        {text}
      </Link>
    </UiLink>
  );
  return (
    <Breadcrumb
      label={t("breadcrumb")}
      items={[
        { key: "designs", content: link("/designs", t("designs")) },
        { key: "photos", content: link("/designs/new/photos", t("photos")) },
        { key: "current", content: t("title") },
      ]}
    />
  );
}

/** Breadcrumb of both screens: My designs / (New pattern or From a photo) / current page. */
import { Breadcrumb, Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link PhotoBreadcrumb}. */
interface PhotoBreadcrumbProps {
  /** Name of the current page (already translated). */
  readonly current: string;
  /** When set, the middle item links to the photo step instead of the new-design page. */
  readonly viaPhotos?: boolean;
}

/**
 * Renders the breadcrumb.
 *
 * @param props - The current page and whether the path goes through the photo step.
 * @returns The breadcrumb.
 */
export function PhotoBreadcrumb({
  current,
  viaPhotos = false,
}: Readonly<PhotoBreadcrumbProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  const middle = viaPhotos
    ? { href: "/designs/new/photos", text: t("title") }
    : { href: "/designs/new", text: t("newDesign") };
  return (
    <Breadcrumb
      label={t("breadcrumb")}
      items={[
        {
          key: "designs",
          content: (
            <UiLink asChild>
              <Link href="/designs" className="font-semibold">
                {t("designs")}
              </Link>
            </UiLink>
          ),
        },
        {
          key: "middle",
          content: (
            <UiLink asChild>
              <Link href={middle.href} className="font-semibold">
                {middle.text}
              </Link>
            </UiLink>
          ),
        },
        { key: "current", content: current },
      ]}
    />
  );
}

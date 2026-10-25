/** The path "My designs / <current>" shared by both picker screens. */
import { Breadcrumb } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link DesignsBreadcrumb}. */
interface DesignsBreadcrumbProps {
  /** Name of the current page (already translated). */
  readonly current: string;
}

/**
 * Renders the breadcrumb with a link back to the designs list.
 *
 * @param props - The current page name.
 * @returns The breadcrumb.
 */
export function DesignsBreadcrumb({ current }: Readonly<DesignsBreadcrumbProps>): ReactElement {
  const t = useTranslations("designPicker");
  return (
    <Breadcrumb
      label={t("breadcrumb")}
      items={[
        {
          key: "designs",
          content: (
            <Link href="/designs" className="font-semibold text-primary underline">
              {t("designs")}
            </Link>
          ),
        },
        { key: "current", content: current },
      ]}
    />
  );
}

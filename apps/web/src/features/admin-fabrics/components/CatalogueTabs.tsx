/** The two sections of the catalogue (fabrics and rules) as links that look like the design's tab strip. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props of {@link CatalogueTabs}. */
interface CatalogueTabsProps {
  /** The section that is open. */
  readonly active: "fabrics" | "rules";
}

/** The sections: message key and path. */
const SECTIONS = [
  { key: "fabrics", href: "/admin/fabrics" },
  { key: "rules", href: "/admin/fabric-rules" },
] as const;

/**
 * Renders the tab links.
 *
 * @param props - The open section.
 * @returns The navigation.
 */
export function CatalogueTabs({ active }: Readonly<CatalogueTabsProps>): ReactElement {
  const t = useTranslations("admin.fabrics.tabs");
  return (
    <nav aria-label={t("label")} className="inline-flex gap-1 self-start rounded-md bg-surface-hover p-1">
      {SECTIONS.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          aria-current={section.key === active ? "page" : undefined}
          className={`flex min-h-11 items-center rounded-md px-4 text-base font-semibold ${
            section.key === active ? "bg-surface text-text shadow-card" : "text-muted"
          }`}
        >
          {t(section.key)}
        </Link>
      ))}
    </nav>
  );
}

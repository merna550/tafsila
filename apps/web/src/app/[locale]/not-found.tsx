/** The 404 page in the design system: also what a signed-in non-admin sees on /admin, so the admin area is not advertised. */
import { EmptyState } from "@tafsila/ui";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/**
 * Renders "page not found" with a link home.
 *
 * @returns The page.
 */
export default async function NotFoundPage(): Promise<ReactElement> {
  const t = await getTranslations("notFound");
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        title={t("title")}
        description={t("description")}
        action={
          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-md bg-primary px-5 text-lg font-semibold text-on-primary hover:bg-primary-hover"
          >
            {t("home")}
          </Link>
        }
      />
    </div>
  );
}

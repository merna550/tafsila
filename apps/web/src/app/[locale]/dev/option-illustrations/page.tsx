/** Dev-only gallery of every placeholder option drawing, for review before final art (issue #241). */
import { loadPublicConfig } from "@tafsila/config";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { OptionIllustration, listIllustrations } from "@/features/design-picker/illustrations";

/**
 * Shows each drawing at picker size with its path and value; answers 404 in production.
 *
 * @returns The gallery page.
 */
export default function OptionIllustrationsPage(): ReactElement {
  if (loadPublicConfig().appEnv === "production") notFound();
  return (
    <main className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4 lg:grid-cols-6" dir="rtl">
      {listIllustrations().map(({ path, value }) => (
        <figure key={`${path}:${value}`} className="flex flex-col items-center gap-2 text-primary">
          <span className="size-14">
            <OptionIllustration path={path} value={value as never} />
          </span>
          <figcaption className="text-sm text-muted" dir="ltr">
            {path} / {value}
          </figcaption>
        </figure>
      ))}
    </main>
  );
}

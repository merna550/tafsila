/** Test-only page that hosts the pattern preview hook for the browser test, until the pattern page (#251) exists. */
import { loadPublicConfig } from "@tafsila/config";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { PreviewProbe } from "@/shared/pattern-preview/PreviewProbe";

/**
 * Renders the probe for `?design=`; answers 404 in production.
 *
 * @param props - Route props.
 * @param props.searchParams - Query holding the design name.
 * @returns The probe page.
 */
export default async function PatternPreviewDevPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ design?: string }> }>): Promise<ReactElement> {
  if (loadPublicConfig().appEnv === "production") notFound();
  const { design } = await searchParams;
  return (
    <main className="p-6">
      <PreviewProbe design={design} />
    </main>
  );
}

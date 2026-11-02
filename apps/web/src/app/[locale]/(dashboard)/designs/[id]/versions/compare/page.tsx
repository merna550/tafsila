/** The compare route: composes the compare screen with the design id and the two version ids from the query. */
import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { CompareScreen } from "@/features/version-compare";
import { redirect } from "@/shared/i18n";

/**
 * Renders the overlay of two versions of one design; without both ids it goes back to the history, where they are picked.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id.
 * @param props.searchParams - Holds `a` and `b`, the two version ids.
 * @returns The page.
 */
export default async function DesignComparePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>): Promise<ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  const a = typeof query.a === "string" ? query.a : "";
  const b = typeof query.b === "string" ? query.b : "";
  if (a === "" || b === "") {
    redirect({ href: `/designs/${id}/versions`, locale: await getLocale() });
  }
  return <CompareScreen designId={id} a={a} b={b} />;
}

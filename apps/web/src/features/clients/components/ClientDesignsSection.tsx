/** The client's latest designs on her profile, with a link to all of them and the "new pattern" link when she has none. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { NewPatternLink, type DesignRow } from "@/entities/design";
import { Link } from "@/shared/i18n";

/** Props for {@link ClientDesignsSection}. */
interface ClientDesignsSectionProps {
  /** Client id. */
  readonly clientId: string;
  /** Her latest designs. */
  readonly designs: readonly DesignRow[];
  /** All her designs, over all pages. */
  readonly total: number;
}

/**
 * Renders the section.
 *
 * @param props - Client id, her latest designs and the total.
 * @returns The section.
 */
export function ClientDesignsSection({
  clientId,
  designs,
  total,
}: Readonly<ClientDesignsSectionProps>): ReactElement {
  const t = useTranslations("clients.profile.designs");
  return (
    <section aria-labelledby="client-designs-title" className="flex flex-col gap-3">
      <h2 id="client-designs-title" className="text-xl font-semibold text-text">
        {t("title")}
      </h2>
      {designs.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-surface p-4 shadow-card">
          <p className="text-base text-muted">{t("empty")}</p>
          <NewPatternLink clientId={clientId} variant="secondary" />
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {designs.map((design) => (
              <li key={design.id}>
                <Link
                  href={`/designs/${design.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-surface p-4 shadow-card hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <strong className="min-w-0 truncate text-base font-semibold text-text">
                    {design.title}
                  </strong>
                  <span className="shrink-0 text-sm text-muted">{design.updated}</span>
                </Link>
              </li>
            ))}
          </ul>
          {total > designs.length ? (
            <Link href={`/designs?clientId=${clientId}`} className="font-semibold text-primary underline">
              {t("seeAll", { count: total })}
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}

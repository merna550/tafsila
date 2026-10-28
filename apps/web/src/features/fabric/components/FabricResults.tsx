/** The lengths to buy, one tile per fabric kind that has pieces (FR-FAB-05); metres with one decimal in Western digits. */
import { StatTile } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { FabricKind } from "@/shared/fabric-nesting";
import type { CalcView } from "../model/calc-view";
import { formatCm, formatMetres } from "../model/format";

/** Props of {@link FabricResults}. */
interface FabricResultsProps {
  /** The calculation to show. */
  readonly view: CalcView;
  /** True when pieces do not fit, so the lengths cannot be trusted. */
  readonly blocked: boolean;
  /** Builds the projector link of a fabric kind; absent hides the buttons (FR-FAB-04). */
  readonly projectHref?: (kind: FabricKind) => string;
}

/**
 * Renders the length tiles and the rounding note.
 *
 * @param props - The calculation, whether it is blocked and the projector link builder.
 * @returns The results.
 */
export function FabricResults({ view, blocked, projectHref }: Readonly<FabricResultsProps>): ReactElement {
  const t = useTranslations("fabric.calc.results");
  const detail = t(`detail.${view.options.layout}`, { width: formatCm(view.options.widthMm) });
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xl font-semibold">{t("title")}</h3>
      <dl className="m-0 grid gap-3 sm:grid-cols-3">
        {view.kinds.map((line) => (
          <div key={line.kind} data-testid={`fabric-length-${line.kind}`}>
            <StatTile
              label={t(`kind.${line.kind}`)}
              value={
                blocked || line.lengthM === 0 ? t("none") : t("metres", { value: formatMetres(line.lengthM) })
              }
            />
            <p className="mt-1 text-sm text-muted">{blocked ? t("blocked") : detail}</p>
            {projectHref ? (
              <ProjectLink href={blocked || line.lengthM === 0 ? null : projectHref(line.kind)} />
            ) : null}
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">{t("rounding", { shrinkage: view.options.shrinkagePercent })}</p>
    </div>
  );
}

/**
 * The "Project the layout" link; without a computed layout it is a disabled button with the reason as its title.
 *
 * @param props - The projector href, or null when there is nothing to project.
 * @param props.href - The projector route, or null.
 * @returns The link or the disabled button.
 */
function ProjectLink({ href }: Readonly<{ href: string | null }>): ReactElement {
  const t = useTranslations("fabric.calc");
  const style =
    "mt-2 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-base font-semibold";
  if (href === null) {
    return (
      <button type="button" disabled title={t("projectDisabled")} className={`${style} opacity-50`}>
        {t("project")}
      </button>
    );
  }
  return (
    <Link href={href} className={`${style} text-primary hover:bg-surface-hover`}>
      {t("project")}
    </Link>
  );
}

"use client";
/** The top of the pattern page: path, title, status, version and the save bar. */
import { Badge, Breadcrumb, PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { SaveState } from "../model/save-state";
import { SaveStatusBadge } from "./SaveStatusBadge";
import { SaveVersionBar } from "./SaveVersionBar";

/** Props of {@link PatternPageHeader}. */
interface PatternPageHeaderProps {
  /** The design title, or a fallback while loading. */
  readonly title: string;
  /** Where "Edit design" goes. */
  readonly editHref: string;
  /** Where "Version history" goes. */
  readonly historyHref: string;
  /** The save state. */
  readonly state: SaveState;
  /** The version the page started from or last saved. */
  readonly versionNo: number | undefined;
  /** Called when Save is pressed. */
  readonly onSave: () => void;
}

/**
 * Renders the header.
 *
 * @param props - Title, links and the save state.
 * @returns The header.
 */
export function PatternPageHeader({
  title,
  editHref,
  historyHref,
  state,
  versionNo,
  onSave,
}: Readonly<PatternPageHeaderProps>): ReactElement {
  const t = useTranslations("patternPage");
  const designsLink = (
    <Link href="/designs" className="font-semibold text-primary underline">
      {t("designs")}
    </Link>
  );
  return (
    <>
      <Breadcrumb
        label={t("breadcrumb")}
        items={[
          { key: "designs", content: designsLink },
          { key: "current", content: title },
        ]}
      />
      <PageHeader
        title={title}
        actions={
          <div className="flex flex-wrap items-start gap-3">
            <Link href={editHref} className="min-h-11 py-2 font-semibold text-primary underline">
              {t("editDesign")}
            </Link>
            <Link
              href={historyHref}
              className="min-h-11 py-2 font-semibold text-primary underline"
              data-testid="version-history-link"
            >
              {t("versionHistory")}
            </Link>
            <SaveVersionBar state={state} onSave={onSave} />
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SaveStatusBadge state={state} />
        {versionNo === undefined ? null : (
          <Badge tone="info" data-testid="version-badge">
            {t("version", { n: versionNo })}
          </Badge>
        )}
      </div>
    </>
  );
}

"use client";
/** The top of the direct-cut screen: breadcrumb, title with the piece, and the screen's actions. */
import { Badge, Breadcrumb, Button, PageHeader } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props of {@link DirectCutHeader}. */
interface DirectCutHeaderProps {
  /** The design title. */
  readonly title: string;
  /** Version number. */
  readonly versionNo: number;
  /** Engine version shown under the title. */
  readonly engineVersion: string;
  /** True when the version was made with an older engine. */
  readonly engineChanged: boolean;
  /** The chosen piece's name in both languages, if any. */
  readonly pieceName: { readonly ar: string; readonly en: string } | undefined;
  /** True once the steps are ready, so the plan actions work. */
  readonly ready: boolean;
  /** The version page. */
  readonly versionHref: string;
  /** Opens the print view. */
  readonly onPrintView: () => void;
  /** Asks to clear the ticks. */
  readonly onClear: () => void;
}

const LINK_CLASS = "font-semibold text-primary underline";

/**
 * Renders the path "My designs / design · Version N / Direct cut".
 *
 * @param props - The design title, the version number and the version page.
 * @param props.title - The design title.
 * @param props.versionNo - Version number.
 * @param props.versionHref - The version page.
 * @returns The breadcrumb.
 */
function DirectCutBreadcrumb({
  title,
  versionNo,
  versionHref,
}: Readonly<{ title: string; versionNo: number; versionHref: string }>): ReactElement {
  const t = useTranslations("directCut");
  return (
    <Breadcrumb
      label={t("breadcrumb")}
      items={[
        {
          key: "designs",
          content: (
            <Link href="/designs" className={LINK_CLASS}>
              {t("designs")}
            </Link>
          ),
        },
        {
          key: "version",
          content: (
            <Link href={versionHref} className={LINK_CLASS}>
              {`${title} · ${t("version", { n: versionNo })}`}
            </Link>
          ),
        },
        { key: "current", content: t("title") },
      ]}
    />
  );
}

/**
 * Renders the header.
 *
 * @param props - Version data, the chosen piece and the handlers.
 * @returns The header.
 */
export function DirectCutHeader(props: Readonly<DirectCutHeaderProps>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as "ar" | "en";
  const { title, versionNo, versionHref, ready } = props;
  return (
    <>
      <DirectCutBreadcrumb title={title} versionNo={versionNo} versionHref={versionHref} />
      <PageHeader
        title={
          <>
            {t("title")}
            {props.pieceName ? (
              <span className="text-base font-normal text-muted"> ({props.pieceName[locale]})</span>
            ) : null}
          </>
        }
        description={t("meta", { n: versionNo, engine: props.engineVersion })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {props.engineChanged ? <Badge tone="warning">{t("engineOld")}</Badge> : null}
            <Button
              variant="secondary"
              disabled={!ready}
              onClick={props.onPrintView}
              data-testid="open-print-view"
            >
              {t("viewPrint")}
            </Button>
            <Button variant="secondary" disabled={!ready} onClick={props.onClear} data-testid="clear-ticks">
              {t("clearTicks")}
            </Button>
            <Link href={versionHref} className={`inline-flex min-h-11 items-center px-3 ${LINK_CLASS}`}>
              {t("backToVersion")}
            </Link>
          </div>
        }
      />
    </>
  );
}

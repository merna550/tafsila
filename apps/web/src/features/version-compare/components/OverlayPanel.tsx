"use client";
/** The overlay card with its legend and zoom buttons; owns which versions are shown and the zoom (issue #345). */
import { Button, Card, Spinner } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import type { MatchedPiece } from "../model/match-pieces";
import { CompareLegend } from "./CompareLegend";
import { CompareOverlay } from "./CompareOverlay";

/** Zoom step of the buttons. */
const ZOOM_STEP = 0.5;
/** Smallest zoom: the whole width. */
const ZOOM_MIN = 1;
/** Largest zoom. */
const ZOOM_MAX = 4;

/** A version as the legend needs it. */
export interface PanelVersion {
  /** Version number. */
  readonly versionNo: number;
  /** When it was saved, ISO. */
  readonly createdAt: string;
}

/**
 * Formats the day a version was saved.
 *
 * @param locale - Page language.
 * @param iso - ISO time.
 * @returns A medium date such as "Oct 5, 2026".
 */
function formatDate(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

/** Props of {@link OverlayPanel}. */
interface OverlayPanelProps {
  /** The first version. */
  readonly a: PanelVersion;
  /** The second version. */
  readonly b: PanelVersion;
  /** The matched pieces; empty until both drafts are done. */
  readonly pieces: readonly MatchedPiece[];
  /** True while a draft runs. */
  readonly building: boolean;
  /** True when a draft failed. */
  readonly failed: boolean;
}

/**
 * Renders the drawing area: the overlay, a spinner while building, or the failure.
 *
 * @param props - Versions, pieces and the draft state.
 * @returns The card, the legend and the zoom buttons.
 */
export function OverlayPanel({ a, b, pieces, building, failed }: Readonly<OverlayPanelProps>): ReactElement {
  const t = useTranslations("compare");
  const locale = useLocale();
  const [showA, setShowA] = useState(true);
  const [showB, setShowB] = useState(true);
  const [zoom, setZoom] = useState(ZOOM_MIN);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <Card className="overflow-auto p-4">
        {failed ? (
          <p role="alert" className="text-base text-danger">
            {t("failed")}
          </p>
        ) : null}
        {building && !failed ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-base text-text">
            <Spinner label={t("building")} />
            {t("building")}
          </div>
        ) : null}
        {building || failed ? null : (
          <CompareOverlay
            pieces={pieces}
            showA={showA}
            showB={showB}
            zoom={zoom}
            label={t("overlayLabel", { a: a.versionNo, b: b.versionNo })}
          />
        )}
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CompareLegend
          a={{
            versionNo: a.versionNo,
            date: formatDate(locale, a.createdAt),
            shown: showA,
            onChange: setShowA,
          }}
          b={{
            versionNo: b.versionNo,
            date: formatDate(locale, b.createdAt),
            shown: showB,
            onChange: setShowB,
          }}
        />
        <ZoomButtons zoom={zoom} onChange={setZoom} />
      </div>
    </div>
  );
}

/** Props of {@link ZoomButtons}. */
interface ZoomButtonsProps {
  /** Current zoom. */
  readonly zoom: number;
  /** Called with the new zoom. */
  readonly onChange: (zoom: number) => void;
}

/**
 * The zoom in and zoom out buttons, each disabled at its limit.
 *
 * @param props - Zoom and the handler.
 * @returns A button group.
 */
function ZoomButtons({ zoom, onChange }: Readonly<ZoomButtonsProps>): ReactElement {
  const t = useTranslations("compare.zoom");
  return (
    <div className="flex gap-2" role="group" aria-label={t("label")}>
      <Button variant="secondary" disabled={zoom <= ZOOM_MIN} onClick={() => onChange(zoom - ZOOM_STEP)}>
        {t("out")}
      </Button>
      <Button variant="secondary" disabled={zoom >= ZOOM_MAX} onClick={() => onChange(zoom + ZOOM_STEP)}>
        {t("in")}
      </Button>
    </div>
  );
}

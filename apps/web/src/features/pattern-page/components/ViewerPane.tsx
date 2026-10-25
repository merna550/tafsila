"use client";
/** The left area of the page: layer toggles and the viewer, dimmed while the preview updates. */
import { Button, Card, Skeleton } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import {
  LayerToggles,
  PatternViewer,
  type PatternScene,
  type ViewerController,
} from "@/features/pattern-viewer";
import type { ApiError, Locale } from "@/shared/api";
import { ApiErrorView, routeError } from "@/shared/error-display";

/** Props of {@link ViewerPane}. */
interface ViewerPaneProps {
  /** The scene to draw, once a draft finished. */
  readonly scene: PatternScene | undefined;
  /** The viewer state. */
  readonly viewer: ViewerController;
  /** True while a newer draft is running or pending. */
  readonly updating: boolean;
  /** The preview failure to show instead of the drawing, if any. */
  readonly error: ApiError | null;
  /** True when no measurement set is chosen yet. */
  readonly needsSet: boolean;
  /** Opens the options tab. */
  readonly onOpenOptions: () => void;
}

/**
 * What the pane shows when there is nothing to draw: the "choose measurements" card, the engine error or a skeleton.
 *
 * @param props - Component props.
 * @param props.error - The preview failure, if any.
 * @param props.needsSet - True without a chosen set.
 * @param props.onOpenOptions - Opens the options tab.
 * @returns The element.
 */
function EmptyViewer({
  error,
  needsSet,
  onOpenOptions,
}: Readonly<Pick<ViewerPaneProps, "error" | "needsSet" | "onOpenOptions">>): ReactElement {
  const t = useTranslations("patternPage");
  const locale = useLocale() as Locale;
  if (error !== null) return <ApiErrorView route={routeError(error, "load", locale)} />;
  if (needsSet) {
    return (
      <Card className="flex flex-col items-start gap-2 p-6" data-testid="viewer-empty">
        <h2 className="text-lg font-semibold text-text">{t("noSet.title")}</h2>
        <p className="text-muted">{t("noSet.body")}</p>
        <Button type="button" variant="secondary" onClick={onOpenOptions}>
          {t("noSet.action")}
        </Button>
      </Card>
    );
  }
  return <Skeleton className="h-96 w-full" />;
}

/**
 * Renders the drawing area.
 *
 * @param props - Scene, viewer state and the page flags.
 * @returns The pane.
 */
export function ViewerPane({
  scene,
  viewer,
  updating,
  error,
  needsSet,
  onOpenOptions,
}: Readonly<ViewerPaneProps>): ReactElement {
  const t = useTranslations("patternPage");
  if (scene === undefined) {
    return <EmptyViewer error={error} needsSet={needsSet} onOpenOptions={onOpenOptions} />;
  }
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="viewer-pane" data-updating={updating}>
      <LayerToggles layers={viewer.layers} onToggle={viewer.toggleLayer} />
      <div className={updating ? "relative opacity-50" : "relative"}>
        <PatternViewer
          ref={viewer.ref}
          scene={scene}
          layers={viewer.layers}
          selectedPieceId={viewer.selectedPieceId}
          onSelectPiece={viewer.selectPiece}
          highlight={viewer.highlight}
          measure={viewer.measure}
          onMeasureChange={viewer.setMeasure}
        />
        {updating ? (
          <p
            role="status"
            className="absolute inset-x-0 top-1/2 text-center font-semibold text-text"
            data-testid="preview-updating"
          >
            {t("updating")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

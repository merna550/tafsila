"use client";
/** The controls bar of the projector page: version line, fullscreen, recalibrate, exit, colour, line width, mirror and help (issue #286). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { FullscreenController } from "../model/controllers";
import { clampLineWidth, type ProjectorView } from "../model/projector-view";
import {
  LINE_WIDTH_MAX_PX,
  LINE_WIDTH_MIN_PX,
  PROJECTOR_COLORS,
  type ProjectorColor,
} from "../projector.schema";
import { FullscreenButton } from "./FullscreenButton";
import { LINK_BUTTON } from "./link-button";

/** Props of {@link ProjectorToolbar}. */
export interface ProjectorToolbarProps {
  /** The version line: design, version number and engine version. */
  readonly versionLine: string;
  /** The current view. */
  readonly view: ProjectorView;
  /** Fullscreen controls. */
  readonly fullscreen: FullscreenController;
  /** Where "Recalibrate" goes. */
  readonly recalibrateHref: string;
  /** Where "Exit" goes (the version view). */
  readonly exitHref: string;
  /** Flips the pattern. */
  readonly onMirror: () => void;
  /** Sets the line width. */
  readonly onLineWidth: (px: number) => void;
  /** Sets the line colour. */
  readonly onColor: (color: ProjectorColor) => void;
  /** Opens the keyboard help. */
  readonly onHelp: () => void;
}

const LINK_OUTLINE = `${LINK_BUTTON} border border-border bg-surface text-text hover:bg-surface-hover`;

/**
 * The two line colours as a pair of toggle buttons.
 *
 * @param props - Current colour and its setter.
 * @param props.value - The colour now.
 * @param props.onChange - Called with the chosen colour.
 * @returns The colour group.
 */
function ColorChoice({
  value,
  onChange,
}: Readonly<{ value: ProjectorColor; onChange: (c: ProjectorColor) => void }>): ReactElement {
  const t = useTranslations("projector.view");
  return (
    <div role="group" aria-label={t("color")} className="flex items-center gap-2">
      <span className="text-sm">{t("color")}</span>
      {PROJECTOR_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-pressed={value === color}
          aria-label={t(color === "white" ? "colorWhite" : "colorYellow")}
          onClick={() => onChange(color)}
          className={`size-8 rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
            color === "white" ? "bg-surface" : "bg-saffron"
          } ${value === color ? "border-focus" : "border-muted"}`}
        />
      ))}
    </div>
  );
}

/**
 * The line width slider; arrow keys on it change the width, not the pan.
 *
 * @param props - Current width and its setter.
 * @param props.value - Width in px.
 * @param props.onChange - Called with the new width.
 * @returns The slider with its label.
 */
function WidthSlider({
  value,
  onChange,
}: Readonly<{ value: number; onChange: (px: number) => void }>): ReactElement {
  const t = useTranslations("projector.view");
  return (
    <label className="flex items-center gap-2 text-sm">
      {t("lineWidth", { n: value })}
      <input
        type="range"
        min={LINE_WIDTH_MIN_PX}
        max={LINE_WIDTH_MAX_PX}
        step={1}
        value={value}
        onChange={(event) => onChange(clampLineWidth(Number(event.target.value)))}
        className="accent-saffron"
      />
    </label>
  );
}

/**
 * Renders the bar over the top of the canvas.
 *
 * @param props - See {@link ProjectorToolbarProps}.
 * @returns The toolbar.
 */
export function ProjectorToolbar(props: Readonly<ProjectorToolbarProps>): ReactElement {
  const t = useTranslations("projector.view");
  const { view } = props;
  return (
    <div
      role="toolbar"
      aria-label={t("controls")}
      className="absolute inset-x-0 top-0 z-sticky flex flex-wrap items-center justify-between gap-3 bg-text/90 px-4 py-2 text-surface"
    >
      <h1 className="text-base font-semibold">{props.versionLine}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <ColorChoice value={view.color} onChange={props.onColor} />
        <WidthSlider value={view.lineWidthPx} onChange={props.onLineWidth} />
        <Button variant="secondary" aria-pressed={view.mirror} onClick={props.onMirror}>
          {t("mirror")}
        </Button>
        <FullscreenButton fullscreen={props.fullscreen} />
        <Link href={props.recalibrateHref} className={LINK_OUTLINE}>
          {t("recalibrate")}
        </Link>
        <Button variant="secondary" onClick={props.onHelp}>
          {t("help")}
        </Button>
        <Link href={props.exitHref} className={LINK_OUTLINE}>
          {t("exit")}
        </Link>
      </div>
    </div>
  );
}

/**
 * Button and buttonhole marks (issue #143, decision 143, 5), shared by the front closure and the wrist cuff (decision
 * 142, 5). A horizontal buttonhole starts `BUTTONHOLE_PAST_CENTRE_MM` past the button centre towards the opening edge
 * and runs inwards for the button's diameter plus `BUTTONHOLE_EASE_MM` (Aldrich 6th ed., ch. 3, buttons and holes).
 */
import type { Mark, Point } from "@tafsila/schemas";
import { BUTTONHOLE_EASE_MM, BUTTONHOLE_PAST_CENTRE_MM, BUTTON_MAX_SPACING_MM } from "../constants/closure";
import { add, scale } from "../geometry";
import type { Bilingual } from "../i18n/pieces";

/** Which half of an opening a mark is for, printed with its words; `none` when the piece is cut alone (a cuff). */
export type ButtonSide = "front" | "back" | "none";

/** Words added after the size: the right half takes the holes, the left half the buttons (women's wear). */
const SIDE_WORDS: Readonly<Record<ButtonSide, { button: Bilingual; hole: Bilingual }>> = {
  front: {
    button: { ar: " (الأمام الأيسر)", en: " (left front)" },
    hole: { ar: " (الأمام الأيمن)", en: " (right front)" },
  },
  back: {
    button: { ar: " (الخلف الأيسر)", en: " (left back)" },
    hole: { ar: " (الخلف الأيمن)", en: " (right back)" },
  },
  none: { button: { ar: "", en: "" }, hole: { ar: "", en: "" } },
};

/** Where one button sits and which way its opening edge lies. */
export interface ButtonStop {
  /** Mark id suffix, unique on the piece (`1`, `2`...). */
  readonly key: string;
  /** The button's centre, in piece coordinates. */
  readonly centre: Point;
  /** Unit vector from the centre towards the opening edge. */
  readonly towardEdge: Point;
}

/**
 * The button mark: a point at the button's centre.
 *
 * @param stop - Where the button sits.
 * @param diameterMm - Button diameter.
 * @param side - Which half it is sewn on.
 * @returns The mark.
 */
export function buttonMark(stop: ButtonStop, diameterMm: number, side: ButtonSide): Mark {
  const words = SIDE_WORDS[side].button;
  return {
    id: `button-${stop.key}`,
    kind: "button",
    shape: "point",
    at: stop.centre,
    text: { ar: `زرار ${diameterMm} مم${words.ar}`, en: `Button ${diameterMm} mm${words.en}` },
  };
}

/**
 * Length of the buttonhole for a button.
 *
 * @param diameterMm - Button diameter.
 * @returns Buttonhole length in mm.
 */
export function buttonholeLengthMm(diameterMm: number): number {
  return diameterMm + BUTTONHOLE_EASE_MM;
}

/**
 * The buttonhole mark: a line from just past the centre, towards the edge, running inwards.
 *
 * @param stop - Where the button it takes sits once closed.
 * @param diameterMm - Button diameter.
 * @param side - Which half it is cut in.
 * @returns The mark.
 */
export function buttonholeMark(stop: ButtonStop, diameterMm: number, side: ButtonSide): Mark {
  const from = add(stop.centre, scale(stop.towardEdge, BUTTONHOLE_PAST_CENTRE_MM));
  const lengthMm = buttonholeLengthMm(diameterMm);
  const words = SIDE_WORDS[side].hole;
  return {
    id: `buttonhole-${stop.key}`,
    kind: "buttonhole",
    shape: "line",
    from,
    to: add(from, scale(stop.towardEdge, -lengthMm)),
    lengthMm,
    text: { ar: `عروة ${lengthMm} مم${words.ar}`, en: `Buttonhole ${lengthMm} mm${words.en}` },
  };
}

/**
 * Evenly spaced button positions between two distances along an opening: the fewest buttons that keep every gap
 * within `BUTTON_MAX_SPACING_MM` (Aldrich: 70 to 100 mm apart), first and last at the ends.
 *
 * @param firstMm - Distance of the first button from the top of the opening.
 * @param lastMm - Distance of the last button; not above the first.
 * @returns Distances from the top, in order.
 */
export function evenButtonStopsMm(firstMm: number, lastMm: number): number[] {
  const spanMm = Math.max(0, lastMm - firstMm);
  const gaps = Math.max(1, Math.ceil(spanMm / BUTTON_MAX_SPACING_MM));
  return Array.from({ length: gaps + 1 }, (_, i) => firstMm + (spanMm * i) / gaps);
}

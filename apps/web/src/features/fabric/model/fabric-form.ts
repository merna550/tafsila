/** The fabric options form as plain values and back to `FabricOptions`; no React (FR-FAB-01, issue #318). */
import {
  FABRIC_WIDTH_PRESETS_MM,
  fabricOptionsSchema,
  type FabricLayout,
  type FabricOptions,
} from "@tafsila/schemas";

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;

/** The width presets in centimetres, in the order they are shown. */
export const WIDTH_PRESETS_CM: readonly number[] = FABRIC_WIDTH_PRESETS_MM.map((mm) => mm / MM_PER_CM);

/** The choice that opens the custom width field. */
export const CUSTOM_WIDTH = "custom";

/** What the form fields hold: text for the numbers so a half-typed value is allowed. */
export interface FabricFormValues {
  /** A preset in cm as text, or {@link CUSTOM_WIDTH}. */
  readonly widthChoice: string;
  /** The custom width in cm as typed. */
  readonly customCm: string;
  /** Folded or open. */
  readonly layout: FabricLayout;
  /** Directional nap. */
  readonly nap: boolean;
  /** Shrinkage in percent as typed. */
  readonly shrinkage: string;
  /** Pattern repeat in cm as typed. */
  readonly repeatCm: string;
}

/** The fields a validation error can point at. */
export type FabricFormField = "customCm" | "shrinkage" | "repeatCm";

/** The message keys (under `fabric.calc.errors`) a wrong field can show. */
export type FabricFormError = "width" | "shrinkage" | "repeat";

/** Result of reading the form: the options, or one message key per wrong field. */
export type FabricFormResult =
  | { readonly ok: true; readonly options: FabricOptions }
  | { readonly ok: false; readonly errors: Partial<Record<FabricFormField, FabricFormError>> };

/**
 * Turns stored options into form values.
 *
 * @param options - The options.
 * @returns The values; a width that is not a preset opens the custom field.
 */
export function optionsToForm(options: FabricOptions): FabricFormValues {
  const widthCm = options.widthMm / MM_PER_CM;
  const preset = WIDTH_PRESETS_CM.includes(widthCm);
  return {
    widthChoice: preset ? String(widthCm) : CUSTOM_WIDTH,
    customCm: preset ? "" : String(widthCm),
    layout: options.layout,
    nap: options.directionalNap,
    shrinkage: String(options.shrinkagePercent),
    repeatCm: String(options.patternRepeatMm / MM_PER_CM),
  };
}

/**
 * Reads a typed number.
 *
 * @param text - What the user typed; empty means 0 for shrinkage and repeat.
 * @returns The number, or NaN when it is not one.
 */
function toNumber(text: string): number {
  const clean = text.trim().replace(",", ".");
  return clean === "" ? Number.NaN : Number(clean);
}

/**
 * Reads the form into options, in mm, and checks them with the shared schema.
 *
 * @param values - The form values.
 * @returns The options, or the message keys (under `fabric.calc.errors`) of the wrong fields.
 */
export function formToOptions(values: FabricFormValues): FabricFormResult {
  const custom = values.widthChoice === CUSTOM_WIDTH;
  const widthCm = custom ? toNumber(values.customCm) : Number(values.widthChoice);
  const shrinkage = values.shrinkage.trim() === "" ? 0 : toNumber(values.shrinkage);
  const repeatCm = values.repeatCm.trim() === "" ? 0 : toNumber(values.repeatCm);
  const parsed = fabricOptionsSchema.safeParse({
    widthMm: widthCm * MM_PER_CM,
    layout: values.layout,
    directionalNap: values.nap,
    shrinkagePercent: shrinkage,
    patternRepeatMm: repeatCm * MM_PER_CM,
  });
  if (parsed.success) return { ok: true, options: parsed.data };
  const errors: Partial<Record<FabricFormField, FabricFormError>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field === "widthMm") errors.customCm = "width";
    if (field === "shrinkagePercent") errors.shrinkage = "shrinkage";
    if (field === "patternRepeatMm") errors.repeatCm = "repeat";
  }
  return { ok: false, errors };
}

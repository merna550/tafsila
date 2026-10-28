/** Form model of the fabric editor: the values, their validation (messages are keys of `admin.fabrics.errors`) and the mapping to the API bodies. */
import {
  FABRIC_LEVEL,
  type AdminFabric,
  type CreateFabricInput,
  type UpdateFabricInput,
} from "@tafsila/schemas";
import { z } from "zod";

/** The properties an admin can set; `stretch` stays 0 for woven fabric in v1 (ADR-320 item 3). */
export const EDITABLE_PROPERTIES = ["drape", "weight", "body", "sheen"] as const;

/** An editable property name. */
export type EditableProperty = (typeof EDITABLE_PROPERTIES)[number];

/** Slug of a catalogue id, the same rule as the shared schema. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A property level 0 to 4 (shown to the admin as 1 to 5). */
const level = z.number().int().min(FABRIC_LEVEL.none, "levelRange").max(FABRIC_LEVEL.max, "levelRange");

/** Schema of the fabric form. */
export const fabricFormSchema = z.object({
  id: z.string().trim().regex(SLUG, "idInvalid"),
  nameAr: z.string().trim().min(1, "nameArRequired"),
  nameEn: z.string().trim().min(1, "nameEnRequired"),
  drape: level,
  weight: level,
  body: level,
  sheen: level,
  careAr: z.string().trim().min(1, "careArRequired"),
  careEn: z.string().trim().min(1, "careEnRequired"),
  reviewed: z.boolean(),
});

/** Values of the fabric form. */
export type FabricFormValues = z.infer<typeof fabricFormSchema>;

/** Level a new fabric starts with on each property (the middle of the scale). */
const MID_LEVEL = FABRIC_LEVEL.mid;

/** Starting values of the "new fabric" form. */
export const EMPTY_FABRIC_FORM: FabricFormValues = {
  id: "",
  nameAr: "",
  nameEn: "",
  drape: MID_LEVEL,
  weight: MID_LEVEL,
  body: MID_LEVEL,
  sheen: MID_LEVEL,
  careAr: "",
  careEn: "",
  reviewed: false,
};

/**
 * Turns a stored fabric into form values.
 *
 * @param fabric - The fabric as the admin API returns it.
 * @returns The values to edit.
 */
export function fabricToForm(fabric: AdminFabric): FabricFormValues {
  const { properties, careNotes } = fabric;
  return {
    id: fabric.id,
    nameAr: fabric.nameAr,
    nameEn: fabric.nameEn,
    drape: properties.drape,
    weight: properties.weight,
    body: properties.body,
    sheen: properties.sheen,
    careAr: careNotes.ar,
    careEn: careNotes.en,
    reviewed: !fabric.isDraft,
  };
}

/**
 * Builds the editable part of a request body from form values (stretch is always 0).
 *
 * @param values - Validated form values.
 * @returns The fields shared by create and update.
 */
function editableFields(values: FabricFormValues): Omit<CreateFabricInput, "id"> {
  return {
    nameAr: values.nameAr,
    nameEn: values.nameEn,
    properties: {
      drape: values.drape,
      weight: values.weight,
      body: values.body,
      stretch: FABRIC_LEVEL.none,
      sheen: values.sheen,
    },
    careNotes: { ar: values.careAr, en: values.careEn },
    isDraft: !values.reviewed,
  };
}

/**
 * Turns form values into the body of POST /api/admin/fabrics.
 *
 * @param values - Validated form values.
 * @returns The create body.
 */
export function toCreateFabricBody(values: FabricFormValues): CreateFabricInput {
  return { id: values.id, ...editableFields(values) };
}

/**
 * Turns form values into the body of PATCH /api/admin/fabrics/{id} (the id is in the path).
 *
 * @param values - Validated form values.
 * @returns The update body.
 */
export function toUpdateFabricBody(values: FabricFormValues): UpdateFabricInput {
  return editableFields(values);
}

/** Keys of `admin.fabrics.errors` that the schema uses as messages. */
export const FABRIC_ERROR_KEYS: readonly string[] = [
  "idInvalid",
  "nameArRequired",
  "nameEnRequired",
  "careArRequired",
  "careEnRequired",
  "levelRange",
];

/** Maps an API field name to the form field it belongs to. */
const API_FIELD_TO_FORM: Readonly<Record<string, keyof FabricFormValues>> = {
  id: "id",
  nameAr: "nameAr",
  nameEn: "nameEn",
  "careNotes.ar": "careAr",
  "careNotes.en": "careEn",
  "properties.drape": "drape",
  "properties.weight": "weight",
  "properties.body": "body",
  "properties.sheen": "sheen",
};

/**
 * Finds the form field of a field name that the API reported.
 *
 * @param apiField - A name such as `careNotes.ar`.
 * @returns The form field, or undefined when the form has no such field.
 */
export function formFieldOf(apiField: string): keyof FabricFormValues | undefined {
  return API_FIELD_TO_FORM[apiField];
}

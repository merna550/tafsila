/** Form schema of the create/edit client dialog. Messages are keys of `clients.form.errors` in `messages/`, translated by the form. */
import { z } from "zod";

/** Longest name and notes; the same limits as the API contract in `@tafsila/schemas` (`clients.ts`). */
export const MAX_NAME_LENGTH = 120;
export const MAX_NOTES_LENGTH = 2000;

/** Keys of `clients.form.errors` that the schema uses as messages. */
export type ClientFormErrorKey = "nameRequired" | "nameTooLong" | "notesTooLong";

/**
 * Tells whether a message is one of the schema's keys (otherwise it is text that came from the API).
 *
 * @param message - A field error message.
 * @returns True for a key of `clients.form.errors`.
 */
export function isFormErrorKey(message: string): message is ClientFormErrorKey {
  return message === "nameRequired" || message === "nameTooLong" || message === "notesTooLong";
}

/** The dialog's fields. Notes are a plain string in the form ("" means none) and become null/absent in the request. */
export const clientFormSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(MAX_NAME_LENGTH, "nameTooLong"),
  notes: z.string().trim().max(MAX_NOTES_LENGTH, "notesTooLong"),
});

/** Values of the dialog. */
export type ClientFormValues = z.infer<typeof clientFormSchema>;

/** Starting values of an empty dialog. */
export const EMPTY_CLIENT_FORM: ClientFormValues = { name: "", notes: "" };

/**
 * Turns form values into the body of POST /api/clients (empty notes are left out).
 *
 * @param values - Validated form values.
 * @returns The create body.
 */
export function toCreateBody(values: ClientFormValues): { name: string; notes?: string } {
  return values.notes === "" ? { name: values.name } : { name: values.name, notes: values.notes };
}

/**
 * Turns form values into the body of PATCH /api/clients/{id} (empty notes clear the notes with null).
 *
 * @param values - Validated form values.
 * @returns The update body.
 */
export function toUpdateBody(values: ClientFormValues): { name: string; notes: string | null } {
  return { name: values.name, notes: values.notes === "" ? null : values.notes };
}

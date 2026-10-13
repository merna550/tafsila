/** Form schema of the settings name field. Messages are keys of `settings.account` in `messages/`. */
import { z } from "zod";

/** Longest name; the same limit as the API contract (`profile.ts` in `@tafsila/schemas`). */
export const MAX_NAME_LENGTH = 120;

/** Keys of `settings.account` used as error messages. */
export type NameErrorKey = "nameRequired" | "nameTooLong";

/** The name field. */
export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(MAX_NAME_LENGTH, "nameTooLong"),
});

/** Values of the name form. */
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/**
 * Tells whether the typed name differs from the saved one (the save button's enabled state).
 *
 * @param typed - Text in the field.
 * @param saved - Saved name, or null.
 * @returns True when saving would change something.
 */
export function isNameChanged(typed: string, saved: string | null): boolean {
  return typed.trim() !== (saved ?? "");
}

/**
 * Tells whether a message is one of the schema's keys (otherwise it came from the API).
 *
 * @param message - A field error message.
 * @returns True for a key of `settings.account`.
 */
export function isNameErrorKey(message: string): message is NameErrorKey {
  return message === "nameRequired" || message === "nameTooLong";
}

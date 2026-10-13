/** Contracts of /api/profile and /api/account (FR-AUTH-04, FR-AUTH-05): the settings data and the account deletion request. */
import { z } from "zod";

/** Longest profile name accepted. */
const MAX_NAME_LENGTH = 120;

/** The literal the caller must send to delete an account; language independent so a stray or scripted call cannot match by accident. */
export const DELETE_ACCOUNT_CONFIRMATION = "DELETE_MY_ACCOUNT";

/** Languages the app is available in. */
const localeSchema = z.enum(["ar", "en"]).meta({ example: "ar" });

/** A profile name: trimmed, 1 to 120 characters. */
const profileNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH).meta({ example: "منى أحمد" });

/** The signed-in user's settings data as the API returns it. */
export const profileSchema = z.object({
  name: profileNameSchema.nullable().meta({ example: "منى أحمد" }),
  locale: localeSchema,
  email: z.string().nullable().meta({ example: "mona@example.com" }),
});

/** Parsed profile. */
export type Profile = z.infer<typeof profileSchema>;

/** Body of PATCH /api/profile: at least one field; any other field (such as a user id) is refused. */
export const updateProfileInputSchema = z
  .object({ name: profileNameSchema.optional(), locale: localeSchema.optional() })
  .strict()
  .meta({ example: { name: "منى أحمد", locale: "ar" } })
  .refine((value) => value.name !== undefined || value.locale !== undefined, {
    message: "Send at least one of name or locale",
  });

/** Parsed update-profile body. */
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

/** Body of DELETE /api/account; the account to delete always comes from the token, never from the body. */
export const deleteAccountInputSchema = z
  .object({ confirm: z.literal(DELETE_ACCOUNT_CONFIRMATION).meta({ example: DELETE_ACCOUNT_CONFIRMATION }) })
  .strict();

/** Parsed delete-account body. */
export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>;

/** Use case: create a design, naming it from the category and date when the caller gave no title. */
import type { CreateDesignInput, Design } from "@tafsila/schemas";
import { defaultDesignTitle } from "../domain/design-title";
import type { Clock } from "../ports/clock";
import type { DesignRepository } from "../ports/design-repository";
import type { ProfileRepository } from "../ports/profile-repository";
import type { AuthContext } from "../ports/token-verifier";

/** Ports this use case needs. */
export interface CreateDesignDeps {
  readonly designs: DesignRepository;
  readonly profiles: ProfileRepository;
  readonly clock: Clock;
}

/**
 * Creates a design for the caller.
 *
 * @param deps - Design repository, profile repository (language) and clock.
 * @param ctx - Verified caller.
 * @param input - Validated category and optional title.
 * @returns The stored design.
 */
export async function createDesign(
  deps: CreateDesignDeps,
  ctx: AuthContext,
  input: CreateDesignInput,
): Promise<Design> {
  const title = input.title ?? (await untitled(deps, ctx, input.category));
  return deps.designs.create(ctx, { category: input.category, title });
}

/**
 * Builds the default title in the caller's language (Arabic when the profile is missing).
 *
 * @param deps - Profile repository and clock.
 * @param ctx - Verified caller.
 * @param category - Garment category.
 * @returns The default title.
 */
async function untitled(
  deps: Pick<CreateDesignDeps, "profiles" | "clock">,
  ctx: AuthContext,
  category: CreateDesignInput["category"],
): Promise<string> {
  const profile = await deps.profiles.get(ctx);
  return defaultDesignTitle(category, profile?.locale ?? "ar", deps.clock.now());
}

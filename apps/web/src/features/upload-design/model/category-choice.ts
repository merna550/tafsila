/** The category choices of the photo step: three drawable garments, "let the AI decide" and pants as "coming soon" (FR-DES-02). */
import type { GarmentCategory } from "@tafsila/schemas";

/** Choices a person can make. `auto` leaves the decision to the analysis. */
export type CategoryChoice = "dress" | "skirt" | "blouse" | "auto" | "pants";

/** Choices shown, in order. */
export const CATEGORY_CHOICES: readonly CategoryChoice[] = ["dress", "skirt", "blouse", "auto", "pants"];

/** Category stored on the design before the analysis answers when the person lets the AI decide (decision 341). */
export const PLACEHOLDER_CATEGORY: GarmentCategory = "dress";

/**
 * Tells whether the engine can draw the choice in v1.
 *
 * @param choice - The chosen option.
 * @returns False for pants ("coming soon").
 */
export function isAvailable(choice: CategoryChoice): boolean {
  return choice !== "pants";
}

/**
 * Category to store on the new design.
 *
 * @param choice - An available choice.
 * @returns The chosen garment, or the placeholder for "let the AI decide".
 */
export function designCategoryOf(choice: CategoryChoice): GarmentCategory {
  return choice === "skirt" || choice === "blouse" || choice === "dress" ? choice : PLACEHOLDER_CATEGORY;
}

/**
 * Category hint sent to the analysis; none when the AI decides.
 *
 * @param choice - An available choice.
 * @returns The hint, or undefined.
 */
export function hintOf(choice: CategoryChoice): "dress" | "skirt" | "blouse" | undefined {
  return choice === "dress" || choice === "skirt" || choice === "blouse" ? choice : undefined;
}

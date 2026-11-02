/** Public entry of `@tafsila/ai` (issue #337): server-only, imported by `packages/api` alone. */
import { loadAiConfig } from "@tafsila/config";
import type { AiDeps } from "./provider";

export {
  analyzeDesign,
  type AnalyzeDesignInput,
  type AnalyzeDesignOutput,
  type DesignPhoto,
} from "./analyze-design";
export { proposeEdit, type ChatTurn, type ProposeEditInput, type ProposeEditOutput } from "./propose-edit";
export {
  explainRecommendations,
  type ExplainedFabric,
  type ExplainRecommendationsInput,
  type ExplainRecommendationsOutput,
} from "./explain-recommendations";
export { AiOutputInvalidError } from "./errors";
export type { AiDeps } from "./provider";
export type { AiUsage } from "./usage";

/**
 * Dependencies that use the fake provider: fixture answers, no key, no network (decision 337, 2).
 *
 * @returns Dependencies for the three AI functions.
 * @example
 * await proposeEdit({ spec, message: "add pockets" }, createFakeAi());
 */
export function createFakeAi(): AiDeps {
  return { config: loadAiConfig({ AI_PROVIDER: "fake" }) };
}

/**
 * The cuff module (issue #142, FR-PAT-05): a band or elastic cuff on the drafted sleeve hem, the hem's gathers into a
 * band and the slit of an open wrist cuff marked on the sleeve, and the elastic as a notion cut by length.
 */
import type { DesignSpec, Notion } from "@tafsila/schemas";
import { SLEEVE_EDGE, SLEEVE_PIECE_ID } from "../../blocks/sleeve/ids";
import { CUFF_ELASTIC_WIDTH_MM, CUFF_OVERLAP_MM } from "../../constants/cuff";
import { ELASTIC_LENGTH_RATIO } from "../../constants/elastic";
import { DraftingError } from "../../errors/drafting-error";
import { gatherLineMark } from "../../pieces/gather-mark";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";
import {
  type DraftContext,
  type PieceDraft,
  withNotion,
  withPieces,
  withResolved,
} from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { bandCuffPieces, cuffSlitMark, elasticCasingPieces } from "./cuff";
import { cuffOpens, cuffSeamMm } from "./cuff-seam";
import { limbAtHemMm, sleeveBlockOf } from "./limb";
import { assertSleeveCombination } from "./module";
import { CUFF_KEYS, CUFF_RULES } from "./rules";

/** Right after the sleeve modules (30), which draw the hem the cuff sews to. */
export const CUFF_ORDER = 31;

/** Id of the sleeve elastic notion. */
export const SLEEVE_ELASTIC_NOTION_ID = "sleeve-elastic";

/** One elastic per sleeve. */
const PAIR = 2;

/**
 * The sleeve with the band's gathers and slit marked on its hem.
 *
 * @param sleeve - The sleeve piece.
 * @param seamMm - The band's sewn edge.
 * @param opens - Whether the band opens (adds the slit).
 * @returns The new sleeve piece.
 */
function markedSleeve(sleeve: PieceDraft, seamMm: number, opens: boolean): PieceDraft {
  const hem = edgeSegments(sleeve, SLEEVE_EDGE.hem)[0]!;
  const gather = gatherLineMark(SLEEVE_EDGE.hem, hem.to, hem.from, seamMm);
  return { ...sleeve, marks: [...(sleeve.marks ?? []), gather, ...(opens ? [cuffSlitMark(hem)] : [])] };
}

/**
 * The elastic notion: arm girth × `ELASTIC_LENGTH_RATIO`, one per sleeve.
 *
 * @param limbMm - Arm girth where the sleeve ends.
 * @returns The notion.
 */
function sleeveElastic(limbMm: number): Notion {
  return {
    id: SLEEVE_ELASTIC_NOTION_ID,
    kind: "elastic",
    name: { ar: "أستك الكم", en: "Sleeve elastic" },
    lengthMm: limbMm * ELASTIC_LENGTH_RATIO,
    widthMm: CUFF_ELASTIC_WIDTH_MM,
    quantity: PAIR,
  };
}

/**
 * Drafts the cuff.
 *
 * @param ctx - Context after the sleeve modules.
 * @returns The context with the cuff pieces, the marked sleeve and, for elastic, the notion.
 * @throws {DraftingError} an input error for a refused combination, or PIPELINE_STEP_ORDER without a sleeve.
 */
export function draftCuff(ctx: DraftContext): DraftContext {
  assertSleeveCombination(ctx.spec);
  const sleeve = ctx.pieces.find((p) => p.id === SLEEVE_PIECE_ID);
  if (!sleeve) throw new DraftingError("PIPELINE_STEP_ORDER", "The cuff needs a drafted sleeve hem");
  const { cuff, length } = ctx.spec.sleeve!;
  const limbMm = limbAtHemMm(ctx, sleeveBlockOf(ctx));
  const hemMm = edgeLengthMm(sleeve, SLEEVE_EDGE.hem);
  if (cuff === "elastic") {
    const pieces = elasticCasingPieces({ hemMm, seamMm: hemMm, opens: false }, ctx.options);
    const next = withPieces(ctx, [...ctx.pieces, ...pieces]);
    return withResolved(withNotion(next, sleeveElastic(limbMm)), { [CUFF_KEYS.overlapMm]: 0 });
  }
  const opens = cuffOpens(length);
  const seamMm = cuffSeamMm(cuff, limbMm);
  const pieces = bandCuffPieces({ hemMm, seamMm, opens }, ctx.options);
  const marked = ctx.pieces.map((p) => (p.id === sleeve.id ? markedSleeve(sleeve, seamMm, opens) : p));
  return withResolved(withPieces(ctx, [...marked, ...pieces]), {
    [CUFF_KEYS.overlapMm]: opens ? CUFF_OVERLAP_MM : 0,
  });
}

/**
 * Whether the design asks for a cuff on a drafted sleeve.
 *
 * @param spec - The design.
 * @returns True for a band or elastic cuff on any sleeve type but none.
 */
function wantsCuff(spec: DesignSpec): boolean {
  return spec.sleeve !== undefined && spec.sleeve.type !== "none" && spec.sleeve.cuff !== "none";
}

/** Band and elastic cuffs. */
export const cuffModule: FeatureModule = {
  id: "sleeve/cuff",
  order: CUFF_ORDER,
  appliesTo: wantsCuff,
  draft: draftCuff,
  validations: CUFF_RULES,
};

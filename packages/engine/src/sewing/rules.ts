import { edgeRef, uniqueEdgePairs } from "../pieces/edge-pairs";
import type { DraftContext } from "../pipeline/draft-context";
import { parseRef } from "./refs";
import type { SewingStepDraft } from "./types";

/** One side of a seam, split into piece and edge ids. */
interface Side {
  /** The piece id. */
  readonly piece: string;
  /** The edge id. */
  readonly edge: string;
}

/** A pattern on a piece id and an edge id; a missing edge pattern matches every edge. */
interface Match {
  /** Pattern for the piece id. */
  readonly piece: RegExp;
  /** Pattern for the edge id. */
  readonly edge?: RegExp;
}

/** Maps a seam to a catalogue key: one side matches `on` and, when given, the other side matches `with`. */
interface SeamRule {
  /** The catalogue key. */
  readonly key: string;
  /** What one side must match. */
  readonly on: Match;
  /** What the other side must match, when the rule names both. */
  readonly with?: Match;
}

/** Matches the body pieces of a bodice or skirt that are not facings, bands or linings. */
const BODY = /^(bodice|skirt)-(front|back)(-centre|-side)?$/;

/** Rules tried before the zip rule, in order; the first match wins. */
const RULES_BEFORE_ZIP: readonly SeamRule[] = [
  { key: "lining-seams", on: { piece: /^lining-/ } },
  { key: "belt-join", on: { piece: /^belt-/ } },
  { key: "pocket-bag", on: { piece: /^pocket-bag-/ } },
  { key: "cuff-attach", on: { piece: /^cuff$/, edge: /^seam/ }, with: { piece: /^sleeve$/, edge: /^hem$/ } },
  { key: "cuff-ends", on: { piece: /^cuff$/ } },
  { key: "casing-ends", on: { piece: /^waistband-casing$/, edge: /^(start|end)$/ } },
  { key: "waistband-facing-join", on: { piece: /^waistband/, edge: /^free$/ } },
  { key: "waistband-attach", on: { piece: /^(waistband|waist-facing)/, edge: /^seam/ } },
  { key: "facing-shoulders", on: { piece: /^neck-facing-/, edge: /^shoulder$/ } },
  { key: "facing-attach", on: { piece: /^neck-facing-/, edge: /^neck$/ } },
  { key: "collar-stand-join", on: { piece: /^collar-stand$/, edge: /^top$/ } },
  { key: "collar-outer", on: { piece: /^collar-(under|upper)$/, edge: /^outer$/ } },
  { key: "collar-attach", on: { piece: /^collar-/, edge: /^neck/ } },
  { key: "underarm-seam", on: { piece: /^sleeve$/, edge: /^underarm/ } },
  {
    key: "sleeve-attach",
    on: { piece: /^sleeve$/, edge: /^cap/ },
    with: { piece: /^bodice-/, edge: /^armhole$/ },
  },
  { key: "front-facing-attach", on: { piece: /^(bodice|skirt)-(front|back)-facing$/, edge: /^cf$/ } },
];

/** Rules tried after the zip rule, in order. */
const RULES_AFTER_ZIP: readonly SeamRule[] = [
  { key: "princess-seams", on: { piece: /^bodice-/, edge: /^style/ } },
  { key: "shoulder-seams", on: { piece: /^bodice-/, edge: /^shoulder$/ } },
  { key: "bodice-seams", on: { piece: /^bodice-/ } },
  { key: "tier-rings", on: { piece: /^tier-/, edge: /^(seam|side|cb|cf)/ } },
  { key: "tier-join", on: { piece: /^tier-/, edge: /^(top|bottom)$/ } },
  { key: "waistband-attach", on: { piece: /^tier-/, edge: /^waist$/ } },
  { key: "skirt-seams", on: { piece: /^skirt-/ } },
];

/** The edge id a zip runs along, by closure position. */
const ZIP_EDGE = { "center-back": "cb", side: "side", "center-front": "cf" } as const;

/**
 * Tells whether a side matches a piece and edge pattern.
 *
 * @param side - The side of a seam.
 * @param match - The patterns.
 * @returns True when both patterns match.
 */
function matches(side: Side, match: Match): boolean {
  return match.piece.test(side.piece) && (match.edge ?? /./).test(side.edge);
}

/**
 * Tells whether a seam fits a rule, in either direction.
 *
 * @param rule - The rule.
 * @param a - One side of the seam.
 * @param b - The other side.
 * @returns True when the rule claims the seam.
 */
function fits(rule: SeamRule, a: Side, b: Side): boolean {
  if (!rule.with) return matches(a, rule.on) || matches(b, rule.on);
  return (matches(a, rule.on) && matches(b, rule.with)) || (matches(b, rule.on) && matches(a, rule.with));
}

/**
 * Builds the rule for the seams a zip closes, or none when the design has no zip.
 *
 * @param ctx - The context.
 * @returns The rule, or an empty list.
 */
function zipRules(ctx: DraftContext): readonly SeamRule[] {
  const { type, position } = ctx.spec.closure;
  if (type !== "zip") return [];
  const edge = ZIP_EDGE[position];
  return [{ key: `zip-${edge}`, on: { piece: BODY, edge: new RegExp(`^${edge}$`) } }];
}

/**
 * Maps a seam to its catalogue key, by the ids of its two edges and the closure; the first rule that fits wins.
 *
 * @param ctx - The context.
 * @param a - One side of the seam.
 * @param b - The other side.
 * @returns The key; a seam no rule knows gets the generic `other-seams`.
 */
function seamKey(ctx: DraftContext, a: Side, b: Side): string {
  const rules = [...RULES_BEFORE_ZIP, ...zipRules(ctx), ...RULES_AFTER_ZIP];
  return rules.find((rule) => fits(rule, a, b))?.key ?? "other-seams";
}

/**
 * Groups seam references by catalogue key.
 *
 * @param ctx - The context.
 * @returns One draft per key.
 */
function seamDrafts(ctx: DraftContext): SewingStepDraft[] {
  const byKey = new Map<string, string[]>();
  for (const { piece, edge, targetRef } of uniqueEdgePairs(ctx.pieces)) {
    const target = parseRef(targetRef);
    const key = seamKey(
      ctx,
      { piece: piece.id, edge: edge.id },
      { piece: target.pieceId, edge: target.edgeId ?? "" },
    );
    byKey.set(key, [...(byKey.get(key) ?? []), edgeRef(piece.id, edge.id), targetRef]);
  }
  return [...byKey].map(([key, edges]) => ({ key, edges }));
}

/**
 * Collects `piece/edge` references of edges that match a piece pattern and an edge pattern.
 *
 * @param ctx - The context.
 * @param pieceRe - Pattern for the piece id.
 * @param edgeRe - Pattern for the edge id.
 * @param unpairedOnly - Keep only edges with no seam partner.
 * @returns The references.
 */
function edgesWhere(ctx: DraftContext, pieceRe: RegExp, edgeRe: RegExp, unpairedOnly = false): string[] {
  return ctx.pieces
    .filter((piece) => pieceRe.test(piece.id))
    .flatMap((piece) =>
      piece.edges
        .filter((edge) => edgeRe.test(edge.id) && !(unpairedOnly && edge.pairsWith))
        .map((edge) => edgeRef(piece.id, edge.id)),
    );
}

/** A piece-level job: the catalogue key and where to find its references. */
interface Job {
  /** The catalogue key. */
  readonly key: string;
  /** Finds the references; an empty list means the job does not apply. */
  readonly find: (ctx: DraftContext) => readonly string[];
}

/**
 * Builds a job over the edges of some pieces.
 *
 * @param key - The catalogue key.
 * @param piece - Pattern for the piece id.
 * @param edge - Pattern for the edge id.
 * @param unpairedOnly - Keep only unpaired edges.
 * @returns The job.
 */
function onEdges(key: string, piece: RegExp, edge: RegExp, unpairedOnly = false): Job {
  return { key, find: (ctx) => edgesWhere(ctx, piece, edge, unpairedOnly) };
}

/**
 * Builds a job that applies only when a condition holds.
 *
 * @param when - The condition.
 * @param job - The job.
 * @returns The conditional job.
 */
function onlyIf(when: (ctx: DraftContext) => boolean, job: Job): Job {
  return { key: job.key, find: (ctx) => (when(ctx) ? job.find(ctx) : []) };
}

/**
 * Lists the dart references of every piece.
 *
 * @param ctx - The context.
 * @returns The `piece/dart:<id>` references.
 */
function dartRefs(ctx: DraftContext): string[] {
  return ctx.pieces.flatMap((piece) => piece.darts.map((dart) => `${piece.id}/dart:${dart.id}`));
}

/**
 * Lists the interfacing pieces.
 *
 * @param ctx - The context.
 * @returns Their ids.
 */
function interfacingIds(ctx: DraftContext): string[] {
  return ctx.pieces.filter((piece) => piece.id.includes("-interfacing")).map((piece) => piece.id);
}

/**
 * Lists the waist edges the bodice and the skirt of a dress share, when both have one.
 *
 * @param ctx - The context.
 * @returns The references, or none.
 */
function waistSeamRefs(ctx: DraftContext): string[] {
  const bodice = edgesWhere(ctx, /^bodice-(front|back)(-centre|-side)?$/, /^waist$/, true);
  const skirt = edgesWhere(ctx, /^skirt-(front|back)$/, /^waist$/, true);
  return ctx.spec.category === "dress" && bodice.length > 0 && skirt.length > 0 ? [...bodice, ...skirt] : [];
}

/**
 * Tells whether the sleeve or skirt has one of the given types.
 *
 * @param part - Which part of the spec.
 * @param types - The types.
 * @returns A condition on the context.
 */
function hasType(part: "sleeve" | "skirt", types: readonly string[]): (ctx: DraftContext) => boolean {
  return (ctx) => types.includes(ctx.spec[part]?.type ?? "");
}

/** Piece-level jobs, in no particular order: the catalogue fixes the order of the steps. */
const JOBS: readonly Job[] = [
  { key: "fuse-interfacing", find: interfacingIds },
  onlyIf(hasType("sleeve", ["set-in"]), onEdges("ease-cap", /^sleeve$/, /^cap/)),
  onlyIf(hasType("sleeve", ["puff", "bishop"]), onEdges("gather-sleeve", /^sleeve$/, /^(cap|hem)/)),
  onlyIf(
    hasType("skirt", ["gathered", "tiered"]),
    onEdges("gather-skirt", /^(skirt-(front|back)|tier-\d+-panel)$/, /^waist$/),
  ),
  onlyIf(hasType("skirt", ["pleated"]), onEdges("pleats-baste", /^skirt-(front|back)$/, /^waist$/, true)),
  { key: "sew-darts", find: dartRefs },
  { key: "press-darts", find: dartRefs },
  onlyIf(
    (ctx) => !ctx.pieces.some((piece) => /^(neck-facing|collar)-/.test(piece.id)),
    onEdges("neck-finish", /^bodice-(front|back)(-centre)?$/, /^neck$/, true),
  ),
  onEdges("cap-sleeve-attach", /^(cap|flutter)-sleeve$/, /^cap/),
  onEdges("armhole-bind", /^bodice-/, /^armhole$/, true),
  { key: "waist-seam", find: waistSeamRefs },
  onlyIf(
    hasType("skirt", ["circle-half", "circle-full"]),
    onEdges("level-circle-hem", /^skirt-/, /^hem$/, true),
  ),
  onlyIf(
    (ctx) => ctx.spec.category === "blouse",
    onEdges("hem-bodice", /^bodice-(front|back)(-centre|-side)?$/, /^(hem|waist)$/, true),
  ),
  onEdges("hem-skirt", /^(skirt-(front|back)|tier-\d+-panel)$/, /^hem$/, true),
  onEdges("hem-sleeve", /^(sleeve|cap-sleeve|flutter-sleeve)$/, /^hem$/, true),
  onEdges("hem-lining", /^lining-skirt-/, /^hem$/, true),
  onEdges("slit-finish", /^skirt-/, /^slit$/),
  onEdges("understitch-facing", /^neck-facing-(front|back)$/, /^neck$/),
  onlyIf((ctx) => ctx.spec.closure.type === "buttons", onEdges("buttonholes", BODY, /^cf$/)),
];

/**
 * Runs the piece-level jobs.
 *
 * @param ctx - The context.
 * @returns One draft per job that found something.
 */
function pieceDrafts(ctx: DraftContext): SewingStepDraft[] {
  return JOBS.map((job) => ({ key: job.key, edges: job.find(ctx) })).filter((d) => d.edges.length > 0);
}

/**
 * Finds every step the pieces call for: one per seam group and one per piece-level job (decision 146, 2).
 *
 * @param ctx - The final context, after finishing, layout and validation.
 * @returns The steps, unnumbered and in no particular order.
 */
export function sewingDrafts(ctx: DraftContext): SewingStepDraft[] {
  return [...seamDrafts(ctx), ...pieceDrafts(ctx)];
}

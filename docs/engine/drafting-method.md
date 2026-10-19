# Drafting method for the blocks (issue #122)

The one drafting system every M2 block follows, so the code can be checked against hand-computed points to ± 1 mm (NFR-01). Decision: [ADR-122a](../decisions/122a-drafting-system.md). Requirements: FR-PAT-01, NFR-01.

**Source.** Winifred Aldrich, _Metric Pattern Cutting for Women's Wear_, 6th edition (Wiley-Blackwell, 2015), the metric made-to-measure blocks: Chapter 1 (measuring, size chart), Chapter 2 "Basic blocks" (bodice, skirt, sleeve). FreeSewing is only a reference for curve construction and is not a dependency (ADR-122).

**What this document is.** A paraphrase of the book's construction logic written on our `Measurements` fields. No book text is copied. Where the book gives a value from its size chart that we do not measure, the value is replaced by a ratio (see "Missing lengths").

> **Verification status (read before trusting a number).** The author of this draft had no copy of the book. The step order, the chapter and the ratios below come from the construction logic and the size-12 chart values the author knows, **and the page numbers are not filled in**. Merna checks every row of "Constants" and the step order against her copy and fills the page column (checklist at the end). A wrong constant changes the tables, not the method: edit `DRAFT_CONSTANTS` in `packages/test-fixtures/src/reference-drafts-calc.ts`, regenerate (command at the end) and the fixture and these tables follow.

## Frame and naming

- Millimetres, angles in radians, x to the right, y down, as in `packages/engine/src/geometry/point.ts`.
- **Bodice blocks** (one back half, one front half): x = 0 on the centre line (CB or CF); y = 0 on the horizontal through the high point of shoulder (HPS). The back nape is `backNeckRise` below that line.
- **Skirt blocks** (front half, back half): x = 0 on the centre line, y = 0 on the waist line.
- **Sleeve:** x = 0 on the grain line, y = 0 at the top of the cap. The back of the sleeve is at -x, the front at +x.
- Key point names are `bodice.back.*`, `bodice.front.*`, `skirt.back.*`, `skirt.front.*` and `sleeve.*`. Block issues (#128, #129, #134) assert against these names in `referenceDrafts` (`@tafsila/test-fixtures`).
- Armhole, neckline and sleeve cap curves are not fixed by this document: the engine builds them through the listed key points (`curveThroughPoints`), and the reference only fixes the points they pass through.

## Measurement mapping

Symbols: B bust, W waist, H hip, N neck, BL backLength, FL frontLength, SW shoulderWidth, HD hipDepth, BPD bustPointDistance, BH bustHeight, AL armLength, UA upperArm, WR wrist, WK waistToKnee. All in mm.

| Used by the method              | Our field                                         | Note                                                    |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Bust, waist, hip                | `bust`, `waist`, `hip`                            | circumferences                                          |
| Neck size                       | `neck`                                            |                                                         |
| Back neck to waist              | `backLength`                                      | nape to waist along the centre back                     |
| Front shoulder to waist         | `frontLength`                                     | HPS to waist at the centre front                        |
| Shoulder (point to point)       | `shoulderWidth`                                   | half of it is the x of the shoulder tip                 |
| Bust point position             | `bustPointDistance`, `bustHeight`                 | x = BPD / 2, y = BH (BH is HPS to bust point, SRS §6.2) |
| Hip line depth                  | `hipDepth`                                        | waist to hip line                                       |
| Skirt length                    | `waistToKnee`                                     | the straight-skirt block ends at the knee               |
| Sleeve length, upper arm, wrist | `armLength`, `upperArm`, `wrist`                  |                                                         |
| Not used by these blocks        | `height`, `highBust`, `underBust`, `waistToFloor` | used by later modules (long skirts, fitted styles)      |

### Missing lengths (derived, no schema change)

Merna's decision (ADR-122a): a length the book uses and we do not measure is derived with a ratio taken from the book's size chart (size 12, bust 880 mm). The ratios are constants, never inline.

| Length              | Derivation                                            | Basis (size-12 chart value)                     |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| Armscye depth       | B / 8 + 100                                           | 210 at B = 880; grows by one eighth of the bust |
| Back width (whole)  | B x 356 / 880                                         | 356                                             |
| Chest width (whole) | B x 320 / 880                                         | 320                                             |
| Neck width          | N / 5 - 2                                             | the book's neck / 5 rule                        |
| Shoulder length     | from SW / 2, neck width and the slope                 | horizontal run x sqrt(1 + slope^2)              |
| Shoulder slope      | back 0.36, front 0.40 (drop per mm of run)            | about 20 and 22 degrees                         |
| Bust dart opening   | B x 25 / 880                                          | 25; ignores cup size (see "Known limits")       |
| Waist dart widths   | share of (bust quarter + ease - waist quarter - ease) | see step 7                                      |
| Sleeve cap height   | 2/3 of the armscye depth                              | about 140 at size 12                            |

### `bustHeight` definition

HPS to bust point, measured down the body (SRS §6.2). `docs/engine/README.md` said "shoulder point to bust point"; it is corrected in the same PR. The draft uses it directly: the bust point is at (BPD / 2, BH) in the front bodice frame.

## Ease already inside the blocks

#126's ease tables add only the **style ease** on top of these; never add them twice.

| Where            | Built-in ease                                                                                            | Constant                   |
| ---------------- | -------------------------------------------------------------------------------------------------------- | -------------------------- |
| Bodice bust      | 20 mm per quarter (80 mm in total)                                                                       | `bustEaseQuarterMm`        |
| Bodice waist     | 10 mm per quarter (40 mm in total)                                                                       | `bodiceWaistEaseQuarterMm` |
| Skirt hip        | 10 mm per quarter (40 mm in total)                                                                       | `hipEaseQuarterMm`         |
| Skirt waist      | 5 mm per quarter (20 mm in total)                                                                        | `skirtWaistEaseQuarterMm`  |
| Armhole          | whatever the curve through the key points gives; the sleeve cap ease is measured by FR-VAL-02 (10-40 mm) | n/a                        |
| Sleeve upper arm | 50 mm in total                                                                                           | `sleeveBicepEaseMm`        |
| Sleeve wrist     | 30 mm in total                                                                                           | `sleeveWristEaseMm`        |

## Construction steps

Each step names its key point. Source column: chapter and section of the 6th edition; page numbers are filled in by Merna.

### Bodice back (Chapter 2, "Bodice block", back)

| #   | Step (paraphrased)                                                                                                                                   | Formula (mm)                                                                                                              | Key point                                      | Page |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---- |
| 1   | Start at the nape on the centre back; the HPS level is the back neck rise above it                                                                   | nape = (0, 20)                                                                                                            | `bodice.back.nape`                             |      |
| 2   | Neck point on the HPS level, one fifth of the neck size from the centre less a small deduction                                                       | neckPoint = (N / 5 - 2, 0)                                                                                                | `bodice.back.neckPoint`                        |      |
| 3   | Shoulder tip: from the neck point along the back shoulder slope, the front shoulder length plus the back shoulder ease (0 until the toile, #128)     | length = frontShoulderLength + 0; tip = neckPoint + length x (1, 0.36) / sqrt(1 + 0.36^2)                                 | `bodice.back.shoulderTip`                      |      |
| 4   | Armscye line: square across from the centre back at the armscye depth below the nape level                                                           | y = 20 + (B / 8 + 100)                                                                                                    | `bodice.back.scyeLineCB`                       |      |
| 5   | Underarm point: the bust quarter plus the built-in ease along the armscye line                                                                       | (B / 4 + 20, y of step 4)                                                                                                 | `bodice.back.underarm`                         |      |
| 6   | Back width point: half the back width across, one third of the way down from the shoulder tip (step 3) to the armscye line                           | (0.405 B / 2, tipY + (scyeY - tipY) / 3)                                                                                  | `bodice.back.backWidthPoint`                   |      |
| 7   | Waist: down the centre back by the back length from the nape; the side seam comes in by the share of the waist shaping that is not taken by the dart | waistCB = (0, 20 + BL); shaping = (B / 4 + 20) - (W / 4 + 10); dart = shaping / 2; side x = B / 4 + 20 - (shaping - dart) | `bodice.back.waistCB`, `bodice.back.sideWaist` |      |
| 8   | Waist dart: centred half way across the waist, pointing up to half way between the armscye line and the waist                                        | legs = (side x / 2 +- dart / 2, waist y); apex = (side x / 2, (scyeY + waistY) / 2)                                       | `bodice.back.waistDartLeft/Right/Apex`         |      |

### Bodice front (Chapter 2, "Bodice block", front)

| #   | Step (paraphrased)                                                                                                                                                                                                            | Formula (mm)                                                                                                  | Key point                                          | Page |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---- |
| 1   | Neck point on the HPS level, same width as the back neck                                                                                                                                                                      | (N / 5 - 2, 0)                                                                                                | `bodice.front.neckPoint`                           |      |
| 2   | Centre front neck: deeper than the back neck, below the HPS level                                                                                                                                                             | neckCF = (0, N / 5 + 10)                                                                                      | `bodice.front.neckCF`                              |      |
| 3   | Shoulder tip: as the back, with the steeper front slope                                                                                                                                                                       | (SW / 2, 0.40 x (SW / 2 - neckW))                                                                             | `bodice.front.shoulderTip`                         |      |
| 4   | Armscye line and underarm point: same y and same width as the back                                                                                                                                                            | y = 20 + (B / 8 + 100); x = B / 4 + 20                                                                        | `bodice.front.scyeLineCF`, `bodice.front.underarm` |      |
| 5   | Chest width point: half the chest width across, one third of the way down from the tip                                                                                                                                        | (0.364 B / 2, tipY + (scyeY - tipY) / 3)                                                                      | `bodice.front.chestWidthPoint`                     |      |
| 6   | Bust point from the measured position                                                                                                                                                                                         | (BPD / 2, BH)                                                                                                 | `bodice.front.bustPoint`                           |      |
| 7   | Bust dart: opens on the side seam a little below the underarm, width from the bust; the apex is on the horizontal through the middle of the mouth, 25 mm beyond the bust point towards the side (#128), so the legs are equal | upper = (side x, scyeY + 20); lower = upper + (0, 25 B / 880); apex = (BPD / 2 + 25, (upper.y + lower.y) / 2) | `bodice.front.bustDartUpper/Lower/Apex`            |      |
| 8   | Waist: centre front at the front length; the side seam ends lower than the back by the bust dart opening, so the seam lengths match once the dart is closed                                                                   | waistCF = (0, FL); sideWaist = (side x, 20 + BL + bustDart), side x as back step 7                            | `bodice.front.waistCF`, `bodice.front.sideWaist`   |      |
| 9   | Waist dart: centred under the bust point, ending a little below it; true the dart by extending the shorter leg along its own line to the length of the longer one (#128)                                                      | legs = (BPD / 2 +- dart / 2, y on the waist line), then trued; apex = (BPD / 2, BH + 25)                      | `bodice.front.waistDartLeft/Right/Apex`            |      |

### Straight skirt, front and back (Chapter 2, "Skirt block")

Both halves share the steps; only the dart share and length differ (front 50 % and 90 mm, back 60 % and 140 mm).

| #   | Step (paraphrased)                                                                                          | Formula (mm)                                                                                                  | Key point                                 | Page |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---- |
| 1   | Waist on y = 0 at the centre; hip line down by the hip depth; hem down by the waist-to-knee length          | (0, 0), (0, HD), (0, WK)                                                                                      | `skirt.*.waistCentre/hipCentre/hemCentre` |      |
| 2   | Hip side: the hip quarter plus the built-in ease; the side seam falls straight from there to the hem        | hipX = H / 4 + 10; (hipX, HD), (hipX, WK)                                                                     | `skirt.*.hipSide`, `skirt.*.hemSide`      |      |
| 3   | Waist: shaping is the hip quarter minus the waist quarter; the dart takes its share, the side seam the rest | waistQ = W / 4 + 5; shaping = hipX - waistQ; dart = share x shaping; waistSide = (hipX - (shaping - dart), 0) | `skirt.*.waistSide`                       |      |
| 4   | Dart centred half way across the waist, pointing down to its length                                         | legs = (waistSide.x / 2 +- dart / 2, 0); apex = (waistSide.x / 2, length)                                     | `skirt.*.dartLeft/dartRight/dartApex`     |      |

### Straight and A-line skirts, slits (Chapter 2 "Skirt block", Chapter 3 "A-line skirt", "Vents and slits")

The straight skirt is the block at the resolved length. The A-line and the slit start from it ([decision 135](../decisions/135-straight-a-line-skirt.md)). HD = hip depth, L = skirt length.

| #   | Step (paraphrased)                                                                                      | Formula (mm)                                                      | Key point        | Page |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------- | ---- |
| 1   | A-line: extend the dart axis to the hip line; that is the pivot. Slash square down from it to the hem   | pivot = dart axis at y = HD; slash x = pivot.x                    | pivot            |      |
| 2   | Turn the side panel about the pivot until the dart legs meet; the hem opens by the chord at the slash   | angle = dart angle at the pivot; gain = 2 (L − HD) sin(angle / 2) | `aLineHemGainMm` |      |
| 3   | Redraw the waist as one smooth curve through the closed dart; bridge the opened hem with a smooth curve | waist length kept within 2 mm                                     |                  |      |
| 4   | Slit: sew the seam to the slit top; below it add a self-facing extension with a 45° top; notch the top  | extension 40; top ≥ 10 below the hip line along the seam          | `slit-top` notch |      |
| 5   | A front or back slit needs a centre seam: cut that half as a mirrored pair                              |                                                                   |                  |      |

### Circle skirts, half and full (Chapter 3, "Flared and circular skirts")

One drafted piece is a quarter of the skirt: front and back, each on the fold or as a mirrored pair ([decision 136](../decisions/136-circle-skirts.md)). W = waist + total waist ease, L = skirt length.

| #   | Step (paraphrased)                                                                                | Formula (mm)                                    | Key point                                   | Page |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------- | ---- |
| 1   | Sweep of one quarter: a quarter of the skirt's circle                                             | half: π / 4; full: π / 2                        |                                             |      |
| 2   | Waist radius from the quarter waist arc, then corrected on the drawn curve to 0.01 mm             | r = (W / 4) / sweep (half: W / π; full: W / 2π) | `circle.centre` = (0, -r)                   |      |
| 3   | Waist arc from the centre line to the side; hem arc one skirt length further out                  | waist radius r, hem radius R = r + L            | `circle.waistCentre/waistSide`              |      |
| 4   | Side seam along the radius at the sweep; centre line straight down                                | side length = L                                 | `circle.hemSide`, `circle.hemCentre` (0, L) |      |
| 5   | Grain parallel to the centre line, through the middle of the piece; hang 24 h, then level the hem | grain length L / 2                              |                                             |      |

### Gathered, knife-pleated and tiered skirts (Chapter 3, "Skirts with gathers", "Pleated skirts", "Tiered skirts")

Rectangles of the finished length; no block is traced ([decision 137](../decisions/137-gathered-pleated-tiered.md)). W = waist + total waist ease, L = skirt length, n = panels round the body (4 for front and back on the fold, else 2 × panels per half).

| #   | Step (paraphrased)                                                                  | Formula (mm)                                                                | Key point                     | Page |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- | ---- |
| 1   | Gathered: flat width is the finished waist times the gather ratio                   | width = 1.8 × W (light 2, heavy 1.5); panel = width / n                     | `gather` mark on `waist`      |      |
| 2   | Knife pleats: flat width adds twice the pleat depth per pleat; pleats spaced evenly | width = W + pleats × 2 × 30; spacing = (W / n) / pleats per panel           | fold, placement, arrow        |      |
| 3   | Tiered: three tiers, each 1.5 × the one above; tier 1 is 1.5 × W                    | tier k width = W × 1.5^k; heights 30 %, 33 %, 37 % of L                     | `top` / `bottom` paired       |      |
| 4   | Split at the fabric width: fewest equal panels per half (up to 8)                   | fits when width / (2 × panels per half) + 2 × side allowance ≤ fabric width | `skirt-panel`, `tier-k-panel` |      |

### Princess seams and dart-free bodice (Chapter 3, "Dart manipulation", "Princess line bodice")

Starts from the darted bodice block above; nothing is re-measured ([decision 138](../decisions/138-bodice-shaping.md)). BP = bust point, U / L = upper / lower bust dart legs on the side seam.

| #   | Step (paraphrased)                                                                                                               | Formula (mm)                                                                   | Key point                      | Page |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------ | ---- |
| 1   | Pivot point on the bust point's vertical, level with the middle of the bust dart                                                 | P = (BP.x, (U.y + L.y) / 2)                                                    | pivot                          |      |
| 2   | Style line start: middle of the shoulder, or about a third down the armhole                                                      | shoulder: 0.5 × shoulder length; armhole: min(0.35 × armhole, armhole − 110)   | `style` start                  |      |
| 3   | Close the bust dart: turn the upper side panel about P until U lies on L; the dart opens at the style line                       | angle = ∠(L − P) − ∠(U − P)                                                    | side panel                     |      |
| 4   | Extend the waist dart legs up to P and true them                                                                                 | legs trued about P                                                             | `waist` / `style` corner       |      |
| 5   | Draw each stretch of the seam as one curve, square to the bust level at P; true the side panel to the centre                     | handle 1/3 of the chord; side handle by bisection to equal length              | `princess-bust` notch at P     |      |
| 6   | Back: style line from the shoulder (same distance from the neck point) or the armhole to the waist dart apex, then the dart legs | as steps 2, 4 and 5, nothing turns                                             | `bodice-back-centre` / `-side` |      |
| 7   | Dart-free front: no bust dart; side waist where the side seam equals the back's and the waist keeps its length                   | circle–circle crossing (underarm, back side length) × (CF waist, waist length) | `bodice-front` side waist      |      |

### Necklines and facings (Chapter 4, "Necklines", "Facings")

Starts from the block neck point (HPS) and the centre neck point of each half ([decision 139](../decisions/139-necklines-facings.md)). u = unit shoulder direction, d = depth below the moved neck point, w = widening.

| #   | Step (paraphrased)                                                                  | Formula (mm)                                                                                     | Key point                     | Page |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- | ---- |
| 1   | Move both neck points out along the shoulder by the wider style's amount            | NP' = NP + u · w, w = max(front, back `widenMm`), shoulder left ≥ 15                             | neck point                    |      |
| 2   | Lower or raise the centre neck: style depth, or `depthFrontMm`, within limits       | C' = (0, NP'.y + d), d = block + `depthAddMm`, clamped to [min, scye − 30]                       | centre front neck / nape      |      |
| 3   | Draw the style curve from C' to NP', square to the shoulder at NP'                  | round family: one cubic; V: one cubic; square: line + cubic; sweetheart: arcs R 110 / ≥ 25 / 100 | `neck` edge                   |      |
| 4   | Facing: trace the neck, 60 mm along the shoulder, the neck moved 60 mm in, the fold | outer edge: each neck segment offset 60 mm (one Tiller–Hanson step)                              | `neck-facing-front` / `-back` |      |
| 5   | Interfacing: the facing outline again, cut in interfacing                           | same outline                                                                                     | `neck-facing-*-interfacing`   |      |
| 6   | No closure at the neck: the neck seam must pass over the head                       | 2 × (front + back neck) ≥ 1.55 × neck, else warn                                                 | FR-VAL-08                     |      |

### Collars (Chapter 5, "Flat collars", "Shirt collar with stand", "Mandarin collar")

Starts from the finished neck of each half ([decision 141](../decisions/141-collars.md)). N = back neck + front neck (half neck), H = stand height, r = CF rise.

| #   | Step (paraphrased)                                                                         | Formula (mm)                                                                          | Key point                 | Page |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------- | ---- |
| 1   | Peter pan: lay the back on the front shoulder at the neck point, overlap the shoulder tips | back neck mirrored on its shoulder, laid on the front, turned 2·asin(13 / 2·shoulder) | `neck-back`, `neck-front` |      |
| 2   | Peter pan: outer edge the collar width from the neck, rounded into CF (and CB for a pair)  | offset 70, blended over 30 at the shoulder, ends rounded 30                           | `outer`                   |      |
| 3   | Under collar: the outer edge in by the turn of cloth                                       | offset 67; the outer seam declares the difference                                     | `collar-under`            |      |
| 4   | Stand: straight from CB, curve up to the CF rise over the front neck's length              | cubic over the front neck run, rise r (shirt 10, mandarin 15); straight = N − curve   | `collar-stand` neck       |      |
| 5   | Stand: top edge the stand height above, CF end square to the neck                          | offset H (shirt 30, mandarin 35)                                                      | `top`                     |      |
| 6   | Button extension past CF when the closure is CF buttons                                    | 15 along the CF tangent, corners rounded 10                                           | `extension`               |      |
| 7   | Shirt fall: neck edge = stand top; 45 deep at CB; point 70 long, 15 past CF                | tip = CF top + 15 · t + √(70² − 15²) · n                                              | `collar-upper` / `-under` |      |
| 8   | Mandarin: open end rounded                                                                 | radius 15 at the top corner                                                           | `cf` or `cb` end          |      |

### Set-in sleeve, one piece (Chapter 2, "Sleeve block")

| #   | Step (paraphrased)                                                               | Formula (mm)                                                       | Key point                                 | Page |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------- | ---- |
| 1   | Top of the cap on the grain line                                                 | (0, 0)                                                             | `sleeve.capTop`                           |      |
| 2   | Upper-arm line: cap height below the top, half the upper arm plus ease each side | capH = (2/3) x (B / 8 + 100); half = (UA + 50) / 2; (+-half, capH) | `sleeve.underarmBack/Front`               |      |
| 3   | Wrist: the sleeve length down the grain line, half the wrist plus ease each side | (0, AL), (+-(WR + 30) / 2, AL)                                     | `sleeve.wristCentre/wristBack/wristFront` |      |

The cap curve runs from the underarm points up through the cap top; FR-VAL-02 checks that its length exceeds the armhole by 10-40 mm. The engine (#134) keeps steps 1 and 3 and the half-widths of step 2, but solves the cap height by bisection for 25 mm of ease over its own armhole: the 2/3 height gives a cap shorter than that armhole, so it cannot pass FR-VAL-02. The reference value stays as the starting point to compare with on paper ([decision 134](../decisions/134-set-in-sleeve.md), 1).

### Sleeve styles and cuffs (Chapter 2, "Sleeve variations", "Cuffs and openings")

Every style starts from the set-in block above ([decision 142](../decisions/142-sleeve-styles-cuffs.md)). L = block cap length, M = cap between the upper back notch (96 from the underarm) and the front notch (75), G = arm girth at the hem (upper arm at the underarm line, wrist at the wrist, linear between), S = cuff seam.

| #   | Step (paraphrased)                                                       | Formula (mm)                                                                         | Key point                   | Page |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------- | ---- |
| 1   | Puff: slash and spread the head between the notches                      | head through (±0.15 · bicep, −R), block tangents at the notches; R solved: 1.5 · M   | `cap-back`, `cap-front`     |      |
| 2   | Puff / bishop with a cuff: spread the hem, add blouson length            | hem = S · 1.5 (puff) or S · 1.8 (bishop); drop 20 (puff) or 40 (bishop)              | `hem`                       |      |
| 3   | Cap sleeve: block cap from the back notch to the front notch, curved hem | cap from 90 to L − 75; hem through (0, block hem y); self-lined, cut 4               | `cap-sleeve`                |      |
| 4   | Flutter: half-circle ruffle sewn notch to notch                          | inner arc = armhole span + 25, r = inner / π; depth 100 (cap) or 150 (short)         | `flutter-sleeve`            |      |
| 5   | Band cuff: arm girth plus ease, folded, interfaced                       | S = G + 20; width 50 at the wrist, 30 on the arm; overlap 20 at three-quarter / long | `cuff`, `cuff-interfacing`  |      |
| 6   | Wrist opening: slit on the back half, bound                              | slit 75 at x = −hem / 4; placket strip 150 × 30                                      | `slit` mark, `cuff-placket` |      |
| 7   | Elastic cuff: casing as long as the relaxed hem; elastic cut to the arm  | casing 2 · (10 + 5) high; elastic = G · 0.9, 10 wide, 2 off                          | `sleeve-casing`, notion     |      |

## Reference key points

Sizes S, M and XXL of `egyptianSizeChart` (PR #159, `packages/test-fixtures/src/egyptian-size-chart.ts`), rounded to 0.1 mm. The tables below and `packages/test-fixtures/src/reference-drafts.ts` come from **one calculation** (`reference-drafts-calc.ts`); a test fails when they differ. The "Egyptian chart" waist and the other measurements except bust, hip and height are themselves derived (ADR-158), so these drafts prove the method, not the fit on real bodies.

### bodiceBack

| Key point                    | S (x, y)    | M (x, y)     | XXL (x, y)   |
| ---------------------------- | ----------- | ------------ | ------------ |
| `bodice.back.nape`           | 0, 20       | 0, 20        | 0, 20        |
| `bodice.back.neckPoint`      | 68, 0       | 71, 0        | 80, 0        |
| `bodice.back.shoulderTip`    | 186.6, 42.7 | 194.1, 44.3  | 216.8, 49.2  |
| `bodice.back.backWidthPoint` | 178, 105.1  | 194.2, 109.5 | 242.7, 122.8 |
| `bodice.back.scyeLineCB`     | 0, 230      | 0, 240       | 0, 270       |
| `bodice.back.underarm`       | 240, 230    | 260, 240     | 320, 270     |
| `bodice.back.waistCB`        | 0, 410      | 0, 415       | 0, 430       |
| `bodice.back.sideWaist`      | 212.5, 410  | 232.5, 415   | 292.5, 430   |
| `bodice.back.waistDartLeft`  | 92.5, 410   | 102.5, 415   | 132.5, 430   |
| `bodice.back.waistDartRight` | 120, 410    | 130, 415     | 160, 430     |
| `bodice.back.waistDartApex`  | 106.3, 320  | 116.3, 327.5 | 146.3, 350   |

### bodiceFront

| Key point                      | S (x, y)     | M (x, y)     | XXL (x, y)   |
| ------------------------------ | ------------ | ------------ | ------------ |
| `bodice.front.neckPoint`       | 68, 0        | 71, 0        | 80, 0        |
| `bodice.front.neckCF`          | 0, 80        | 0, 83        | 0, 92        |
| `bodice.front.shoulderTip`     | 185, 46.8    | 192.5, 48.6  | 215, 54      |
| `bodice.front.chestWidthPoint` | 160, 107.9   | 174.5, 112.4 | 218.2, 126   |
| `bodice.front.scyeLineCF`      | 0, 230       | 0, 240       | 0, 270       |
| `bodice.front.underarm`        | 240, 230     | 260, 240     | 320, 270     |
| `bodice.front.bustPoint`       | 90, 240      | 95, 250      | 110, 280     |
| `bodice.front.bustDartUpper`   | 240, 250     | 260, 260     | 320, 290     |
| `bodice.front.bustDartLower`   | 240, 275     | 260, 287.3   | 320, 324.1   |
| `bodice.front.bustDartApex`    | 115, 262.5   | 120, 273.6   | 135, 307     |
| `bodice.front.waistCF`         | 0, 420       | 0, 435       | 0, 480       |
| `bodice.front.sideWaist`       | 212.5, 435   | 232.5, 442.3 | 292.5, 464.1 |
| `bodice.front.waistDartLeft`   | 76.1, 427.3  | 81.2, 438.4  | 96.3, 474.8  |
| `bodice.front.waistDartRight`  | 103.8, 427.3 | 108.8, 438.4 | 123.9, 474.8 |
| `bodice.front.waistDartApex`   | 90, 265      | 95, 275      | 110, 305     |

### skirtBack

| Key point                | S (x, y) | M (x, y) | XXL (x, y) |
| ------------------------ | -------- | -------- | ---------- |
| `skirt.back.waistCentre` | 0, 0     | 0, 0     | 0, 0       |
| `skirt.back.waistSide`   | 222, 0   | 242, 0   | 302, 0     |
| `skirt.back.dartLeft`    | 90, 0    | 100, 0   | 130, 0     |
| `skirt.back.dartRight`   | 132, 0   | 142, 0   | 172, 0     |
| `skirt.back.dartApex`    | 111, 140 | 121, 140 | 151, 140   |
| `skirt.back.hipCentre`   | 0, 200   | 0, 205   | 0, 220     |
| `skirt.back.hipSide`     | 250, 200 | 270, 205 | 330, 220   |
| `skirt.back.hemCentre`   | 0, 570   | 0, 570   | 0, 580     |
| `skirt.back.hemSide`     | 250, 570 | 270, 570 | 330, 580   |

### skirtFront

| Key point                 | S (x, y)  | M (x, y)  | XXL (x, y) |
| ------------------------- | --------- | --------- | ---------- |
| `skirt.front.waistCentre` | 0, 0      | 0, 0      | 0, 0       |
| `skirt.front.waistSide`   | 215, 0    | 235, 0    | 295, 0     |
| `skirt.front.dartLeft`    | 90, 0     | 100, 0    | 130, 0     |
| `skirt.front.dartRight`   | 125, 0    | 135, 0    | 165, 0     |
| `skirt.front.dartApex`    | 107.5, 90 | 117.5, 90 | 147.5, 90  |
| `skirt.front.hipCentre`   | 0, 200    | 0, 205    | 0, 220     |
| `skirt.front.hipSide`     | 250, 200  | 270, 205  | 330, 220   |
| `skirt.front.hemCentre`   | 0, 570    | 0, 570    | 0, 580     |
| `skirt.front.hemSide`     | 250, 570  | 270, 570  | 330, 580   |

### sleeve

| Key point              | S (x, y)   | M (x, y)      | XXL (x, y)  |
| ---------------------- | ---------- | ------------- | ----------- |
| `sleeve.capTop`        | 0, 0       | 0, 0          | 0, 0        |
| `sleeve.underarmBack`  | -160, 140  | -172.5, 146.7 | -210, 166.7 |
| `sleeve.underarmFront` | 160, 140   | 172.5, 146.7  | 210, 166.7  |
| `sleeve.wristBack`     | -92.5, 570 | -95, 575      | -102.5, 590 |
| `sleeve.wristFront`    | 92.5, 570  | 95, 575       | 102.5, 590  |
| `sleeve.wristCentre`   | 0, 570     | 0, 575        | 0, 590      |

### Derived lengths

| Length              | S    | M     | XXL   |
| ------------------- | ---- | ----- | ----- |
| scyeDepth           | 210  | 220   | 250   |
| backWidth           | 356  | 388.4 | 485.5 |
| chestWidth          | 320  | 349.1 | 436.4 |
| neckWidth           | 68   | 71    | 80    |
| frontNeckDepth      | 80   | 83    | 92    |
| backShoulderLength  | 126  | 130.9 | 145.4 |
| frontShoulderLength | 126  | 130.9 | 145.4 |
| bustDart            | 25   | 27.3  | 34.1  |
| backWaistDart       | 27.5 | 27.5  | 27.5  |
| frontWaistDart      | 27.5 | 27.5  | 27.5  |
| sleeveCapHeight     | 140  | 146.7 | 166.7 |

## How the numbers were produced and checked

1. `packages/test-fixtures/src/reference-drafts-calc.ts` holds the arithmetic and the named constants. From the repo root:
   `cd packages/api && ./node_modules/.bin/tsx ../test-fixtures/src/gen-reference-drafts.ts ts > ../test-fixtures/src/reference-drafts.ts` (the fixture) and the same with `md` (the tables above), then `npx prettier --write` on the fixture.
2. Size M was recomputed independently, in a separate script with exact fractions and a different structure, written from the formulas of this document and not from the TypeScript. 24 key points (the ones that depend on a new formula: widths, shoulder, dart legs and apexes, side waists, sleeve points) agree within the 0.1 mm rounding. The script is not committed (it is a one-off check; the PR description records it). Issue #128 changed three steps (back shoulder, bust dart apex, front waist dart truing); the 6 changed values of size M were recomputed the same way, in a separate script using the slope angle and a different truing construction, and agree within the rounding (PR of #128).
3. `reference-drafts.test.ts` checks that every block has every name, values are finite, widths equal the measurement quarter plus the documented ease, the skirt hip line is at `hipDepth`, the bust point is the measured one, and that the fixture equals the calculation.

## Garment assembly (#144)

Aldrich, Metric Pattern Cutting for Women's Wear, ch. 3, "One-piece dress block" (decision 144, 4).

| Step | What the engine does                                                                                                             | Page |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1    | Dress with a waist seam: the skirt dart's centre-side leg sits where the bodice dart closes on the waist; paired notches mark it |      |
| 2    | One-piece: move the skirt half so its waist centre is on the bodice waist centre; keep the skirt below the hip line              |      |
| 3    | Side seam: one curve from the bodice side waist to the skirt hip side point                                                      |      |
| 4    | Waist dart → fisheye: lower apex on the legs' bisector at the skirt dart length (front 90, back 140 mm), 20 mm above the hip     |      |
| 5    | Princess seam: from the waist leg to the dart axis on the hip line, then straight to the hem                                     |      |
| 6    | True the side seams: drop the front lower half until front and back match                                                        |      |

## Known limits

- **Bust dart ignores cup size.** It scales with the bust only. `frontLength - backLength` could refine it later; not needed for the toiles of M2.
- **Back and front each take half the bust ease.** The book may balance them differently (a little more at the front); a change is one constant.
- **The XXL front waist runs the other way.** For XXL the chart's `frontLength` is far above `backLength`, so the front waist at the centre front is lower than at the side seam. This comes from the derived chart (ADR-158), not from the method.
- **The back shoulder ease is 0 until the toile** (#128). Aldrich's back shoulder is longer than the front and eased or darted in; `backShoulderEaseMm` (5-7 mm) is one change and a regeneration, and the engine declares it on the back shoulder edge (`pairsWith.intendedEaseMm`).
- **The armhole does not deepen for loose fits.** Style ease widens the underarm point only; a deeper armscye for loose styles is a later change.
- **Elbow dart, sleeve pitch points and the back neck shaping of the book are not part of the reference.** Style modules add them.

## Checklist for Merna (page numbers and constants)

- [ ] Fill the "Page" column of every step table from the 6th edition.
- [ ] Compare the constants of "Missing lengths" and "Ease already inside the blocks" with the size chart and block instructions.
- [ ] Confirm the step order of the three blocks.
- [ ] Check the garment assembly steps (#144) against Aldrich's one-piece dress block and fill their pages (TC-ENG-144-09).
- [ ] If anything differs, change `DRAFT_CONSTANTS` and regenerate; do not edit the tables by hand.
- [ ] #128, back step 3: the back shoulder is laid as the front shoulder length plus an ease (0 for now) along the back slope; the book eases or darts a longer back shoulder. Check the usual amount.
- [ ] #128, front step 7: the bust dart apex 25 mm beyond the bust point, on the horizontal through the middle of the dart mouth. Check how far the book stops the side dart from the bust point.
- [ ] #128, front step 9: the front waist dart is trued by extending the shorter leg. Check the book's truing step.
- [ ] #142, sleeve styles: check the puff head ratio (1.5) and top width (0.3 of the bicep), the blouson drops (20 puff, 40 bishop), the flutter depths (100, 150), the band ease (20), widths (50, 30), overlap (20) and slit (75) against the book; fill the page numbers of the Sleeve styles table.
- [ ] #141, collars: check the peter pan shoulder overlap (13 mm), widths (70 mm peter pan, 45 mm shirt fall), stand heights and rises (30 / 10 shirt, 35 / 15 mandarin), the 3 mm turn of cloth and the 15 mm button extension against the book; fill the page numbers of the Collars table.

import { CIRCLE_SKIRT_HEM_LEVELLING_NOTE } from "../constants/circle-skirt";
import type { SewingEntry } from "./types";

/**
 * Builds one catalogue entry.
 *
 * @param phase - The stage.
 * @param action - The kind of work.
 * @param ar - Arabic text (feminine imperative).
 * @param en - English text.
 * @returns The entry.
 */
function step(
  phase: SewingEntry["phase"],
  action: SewingEntry["action"],
  ar: string,
  en: string,
): SewingEntry {
  return { phase, action, text: { ar, en } };
}

/**
 * Every sewing instruction the engine can print (FR-PAT-06, NFR-06). The order of the keys is the order of the steps
 * inside one phase. Seam pressing is part of the sew text; a separate `press` step is a real stage.
 */
export const SEWING_CATALOGUE = {
  "fuse-interfacing": step(
    "prepare",
    "press",
    "ألصقي الحشوة اللاصقة على القطع التي لها حشوة قبل البدء.",
    "Fuse the interfacing to its pieces before you start.",
  ),
  "belt-join": step(
    "prepare",
    "sew",
    "خيّطي أجزاء الحزام ببعضها من الأطراف واكوي الخياطة مفتوحة.",
    "Sew the belt strips together end to end and press the seam open.",
  ),
  "ease-cap": step(
    "prepare",
    "sew",
    "اعملي غرزة تسبيل على رأس الكم ليصير على قدر الحردة.",
    "Ease-stitch the sleeve cap so it fits the armhole.",
  ),
  "gather-sleeve": step(
    "prepare",
    "sew",
    "اعملي غرزتي تجميع على حافة الكم المنفوخة.",
    "Run two gathering rows along the full edge of the sleeve.",
  ),
  "gather-skirt": step(
    "prepare",
    "sew",
    "اعملي غرزتي تجميع على حافة الوسط بحيث تصير على قدر الوسط.",
    "Run two gathering rows along the waist edge so it fits the waist.",
  ),
  "pleats-baste": step(
    "prepare",
    "sew",
    "اطوي الكسرات حسب العلامات وثبّتيها بالسراجة.",
    "Fold the pleats on the marks and baste them.",
  ),
  "sew-darts": step(
    "darts",
    "sew",
    "خيّطي الدارتات من الطرف العريض حتى الرأس.",
    "Sew each dart from the wide end to the point.",
  ),
  "press-darts": step("darts", "press", "اكوي الدارتات ناحية المنتصف.", "Press the darts toward the centre."),
  "princess-seams": step(
    "darts",
    "sew",
    "خيّطي خطوط الأميرة بين القطعة الوسطى والجانبية واكوي الخياطة مفتوحة.",
    "Sew the princess seams between the centre and side panels and press them open.",
  ),
  "shoulder-seams": step(
    "shoulders",
    "sew",
    "خيّطي خياطات الكتف واكوي الخياطة مفتوحة.",
    "Sew the shoulder seams and press them open.",
  ),
  "facing-shoulders": step(
    "neckline",
    "sew",
    "خيّطي كتف البطانة الداخلية للرقبة واكوي الخياطة مفتوحة.",
    "Sew the neck facing shoulder seams and press them open.",
  ),
  "facing-attach": step(
    "neckline",
    "attach",
    "ركّبي البطانة الداخلية على فتحة الرقبة من الوجه إلى الوجه.",
    "Attach the neck facing to the neckline, right sides together.",
  ),
  "collar-stand-join": step(
    "neckline",
    "sew",
    "خيّطي القبة على الياقة من الحافة العليا للحامل.",
    "Join the collar to the top of the collar stand.",
  ),
  "collar-outer": step(
    "neckline",
    "sew",
    "خيّطي الحافة الخارجية للياقة من الوجه إلى الوجه، ثم اقلبيها واكويها.",
    "Sew the outer edges of the collar right sides together, turn it out and press.",
  ),
  "collar-attach": step(
    "neckline",
    "attach",
    "ركّبي الياقة على فتحة الرقبة.",
    "Attach the collar to the neckline.",
  ),
  "neck-finish": step(
    "neckline",
    "finish",
    "قفّلي حافة الرقبة بشريط مائل.",
    "Finish the neck edge with bias binding.",
  ),
  "cap-sleeve-attach": step(
    "sleeves",
    "attach",
    "ركّبي الكم القصير على فتحة الإبط.",
    "Attach the cap sleeve to the armhole.",
  ),
  "sleeve-attach": step(
    "sleeves",
    "attach",
    "ركّبي الكم على فتحة الإبط واكوي الخياطة ناحية الكم.",
    "Set the sleeve into the armhole and press the seam toward the sleeve.",
  ),
  "armhole-bind": step("sleeves", "finish", "قفّلي فتحة الإبط بشريط مائل.", "Bind the armhole edge."),
  "pocket-bag": step(
    "side-seams",
    "sew",
    "خيّطي كيس الجيب حول الحافة المنحنية.",
    "Sew the pocket bag around its curved edge.",
  ),
  "bodice-seams": step(
    "side-seams",
    "sew",
    "خيّطي خياطات الجنب والظهر في الصدر واكوي الخياطة مفتوحة.",
    "Sew the bodice side and back seams and press them open.",
  ),
  "underarm-seam": step(
    "side-seams",
    "sew",
    "خيّطي خياطة تحت الإبط في الكم من الإبط حتى الحافة.",
    "Sew the sleeve underarm seam from the armhole to the edge.",
  ),
  "skirt-seams": step(
    "side-seams",
    "sew",
    "خيّطي خياطات التنورة واكوي الخياطة مفتوحة.",
    "Sew the skirt seams and press them open.",
  ),
  "tier-rings": step("side-seams", "sew", "خيّطي خياطة كل طبقة لتصير حلقة.", "Sew each tier into a ring."),
  "tier-join": step(
    "side-seams",
    "attach",
    "ركّبي الطبقات ببعضها من الأعلى للأسفل.",
    "Join the tiers to each other from the top down.",
  ),
  "lining-seams": step(
    "side-seams",
    "sew",
    "خيّطي خياطات البطانة بنفس ترتيب القماش الأساسي.",
    "Sew the lining seams in the same order as the shell.",
  ),
  "other-seams": step(
    "side-seams",
    "sew",
    "خيّطي باقي الخياطات واكوي كل خياطة مفتوحة.",
    "Sew the remaining seams and press each one open.",
  ),
  "waist-seam": step(
    "waist-seam",
    "attach",
    "ركّبي الصدر على التنورة من الوجه إلى الوجه عند خط الوسط.",
    "Join the bodice to the skirt at the waist, right sides together.",
  ),
  "front-facing-attach": step(
    "closure",
    "attach",
    "ركّبي بطانة الأمام على حافة المنتصف.",
    "Attach the front facing to the centre edge.",
  ),
  "zip-cb": step(
    "closure",
    "sew",
    "خيّطي منتصف الخلف تحت علامة السوستة وركّبي السوستة.",
    "Sew the centre back seam below the zip notch and insert the zip.",
  ),
  "zip-cf": step(
    "closure",
    "sew",
    "خيّطي منتصف الأمام تحت علامة السوستة وركّبي السوستة.",
    "Sew the centre front seam below the zip notch and insert the zip.",
  ),
  "zip-side": step(
    "closure",
    "sew",
    "خيّطي الجنبين، واتركي الجنب الأيسر مفتوحًا فوق العلامة وركّبي السوستة.",
    "Sew both side seams, leave the left side open above the notch and insert the zip.",
  ),
  "casing-ends": step(
    "waistband",
    "sew",
    "خيّطي طرفي الجراب ليصير حلقة، واتركي فتحة للأستيك.",
    "Sew the ends of the casing into a ring and leave a gap for the elastic.",
  ),
  "waistband-facing-join": step(
    "waistband",
    "sew",
    "خيّطي الحافة الحرة للحزام مع بطانته، ثم اقلبيهما واكويهما.",
    "Sew the free edge of the waistband to its facing, turn and press.",
  ),
  "waistband-attach": step(
    "waistband",
    "attach",
    "ركّبي الحزام أو بطانة الوسط على حافة الوسط.",
    "Attach the waistband or waist facing to the waist edge.",
  ),
  "cuff-ends": step(
    "hem",
    "sew",
    "خيّطي طرفي الأسورة واكوي الخياطة مفتوحة.",
    "Sew the cuff ends and press the seam open.",
  ),
  "cuff-attach": step("hem", "attach", "ركّبي الأسورة على حافة الكم.", "Attach the cuff to the sleeve edge."),
  "level-circle-hem": {
    phase: "hem",
    action: "press",
    text: CIRCLE_SKIRT_HEM_LEVELLING_NOTE,
  },
  "hem-bodice": step("hem", "finish", "اطوي ذيل البلوزة وخيّطيه.", "Turn up the blouse hem and stitch it."),
  "hem-skirt": step("hem", "finish", "اطوي ذيل التنورة وخيّطيه.", "Turn up the skirt hem and stitch it."),
  "hem-sleeve": step("hem", "finish", "اطوي حافة الكم وخيّطيها.", "Turn up the sleeve hem and stitch it."),
  "hem-lining": step(
    "hem",
    "finish",
    "اطوي ذيل البطانة وخيّطيه أعلى من ذيل القماش.",
    "Turn up the lining hem and stitch it, shorter than the shell hem.",
  ),
  "slit-finish": step(
    "hem",
    "finish",
    "قفّلي حافة الفتحة الجانبية وخيّطيها.",
    "Finish the slit edge and stitch it.",
  ),
  "understitch-facing": step(
    "finish",
    "finish",
    "خيّطي البطانة من الوجه قرب الحافة، وثبّتي طرفها.",
    "Understitch the facing close to the edge and tack its ends.",
  ),
  buttonholes: step(
    "finish",
    "finish",
    "اعملي العراوي وخيّطي الأزرار حسب العلامات.",
    "Sew the buttonholes and buttons on the marks.",
  ),
} as const satisfies Record<string, SewingEntry>;

/** A key of {@link SEWING_CATALOGUE}. */
export type SewingTextKey = keyof typeof SEWING_CATALOGUE;

/** The keys in catalogue order, which is the order of the steps inside a phase. */
export const SEWING_KEYS = Object.keys(SEWING_CATALOGUE) as readonly SewingTextKey[];

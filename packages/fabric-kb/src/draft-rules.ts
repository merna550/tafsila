/**
 * DRAFT recommendation rules: DesignSpec features to the fabric properties they need.
 * DRAFT: reviewed by Merna in the PR (TC-FAB-314-02). `must` rules put breaking fabrics on the avoid list; `prefer`
 * rules only change the score (ADR-314). This is the source for the database seed (#317).
 */
import { FABRIC_LEVEL, RULE_PRIORITY, type FabricRule } from "@tafsila/schemas";

const { low, mid, high } = FABRIC_LEVEL;
const { low: lowPriority, medium, high: highPriority, decisive } = RULE_PRIORITY;

/** The draft rules. */
export const DRAFT_RULES: readonly FabricRule[] = [
  {
    id: "circle-skirt-drape",
    when: [{ path: "skirt.type", op: "in", values: ["circle-half", "circle-full"] }],
    effect: { property: "drape", min: mid, strength: "must" },
    priority: decisive,
    reason: {
      ar: "التنورة الدائرية تحتاج خامة سائبة الوقعة لتنسدل في طيات ناعمة",
      en: "A circle skirt needs a fabric that drapes so it falls in soft folds",
    },
  },
  {
    id: "circle-skirt-light",
    when: [{ path: "skirt.type", op: "in", values: ["circle-half", "circle-full"] }],
    effect: { property: "weight", max: mid, strength: "prefer" },
    priority: medium,
    reason: {
      ar: "الخامة الخفيفة تحافظ على استدارة التنورة دون أن تسحبها للأسفل",
      en: "A light fabric keeps a circle skirt flaring without dragging it down",
    },
  },
  {
    id: "gathered-skirt-drape",
    when: [{ path: "skirt.type", op: "in", values: ["gathered", "tiered"] }],
    effect: { property: "drape", min: mid, strength: "prefer" },
    priority: highPriority,
    reason: {
      ar: "الكشكش يبدو أجمل في خامة ناعمة تنسدل",
      en: "Gathers look best in a soft fabric that falls well",
    },
  },
  {
    id: "gathered-skirt-bulk",
    when: [{ path: "skirt.type", op: "in", values: ["gathered"] }],
    effect: { property: "weight", max: mid, strength: "must" },
    priority: medium,
    reason: {
      ar: "الخامة الثقيلة تعمل سماكة كبيرة عند الخصر مع الكشكش",
      en: "A heavy fabric makes the gathers bulky at the waist",
    },
  },
  {
    id: "tiered-skirt-light",
    when: [{ path: "skirt.type", op: "in", values: ["tiered"] }],
    effect: { property: "weight", max: low, strength: "prefer" },
    priority: medium,
    reason: {
      ar: "الطبقات تحتاج خامة خفيفة حتى لا تثقل التنورة",
      en: "Tiers need a light fabric so the skirt does not get heavy",
    },
  },
  {
    id: "fitted-bodice-body",
    when: [{ path: "bodice.fit", op: "in", values: ["fitted"] }],
    effect: { property: "body", min: mid, strength: "prefer" },
    priority: highPriority,
    reason: {
      ar: "الصدر المحدد يحتاج خامة متماسكة تحافظ على الشكل",
      en: "A fitted bodice needs a fabric with body to hold its shape",
    },
  },
  {
    id: "loose-bodice-drape",
    when: [{ path: "bodice.fit", op: "in", values: ["loose"] }],
    effect: { property: "drape", min: mid, strength: "prefer" },
    priority: lowPriority,
    reason: {
      ar: "القصة الواسعة تبدو أنعم في خامة تنسدل",
      en: "A loose cut looks better in a fabric that drapes",
    },
  },
  {
    id: "puff-sleeve-body",
    when: [{ path: "sleeve.type", op: "in", values: ["puff", "bishop"] }],
    effect: { property: "body", min: mid, strength: "prefer" },
    priority: highPriority,
    reason: {
      ar: "الكم المنفوخ يحتاج خامة متماسكة ليحافظ على انتفاخه",
      en: "A puffed sleeve needs a fabric with body to hold its volume",
    },
  },
  {
    id: "bishop-sleeve-drape",
    when: [{ path: "sleeve.type", op: "in", values: ["bishop"] }],
    effect: { property: "drape", min: mid, strength: "prefer" },
    priority: medium,
    reason: {
      ar: "كم البيشوب ينسدل بنعومة عند الكبك في خامة سائبة",
      en: "A bishop sleeve falls softly into the cuff in a draping fabric",
    },
  },
  {
    id: "flutter-sleeve-drape",
    when: [{ path: "sleeve.type", op: "in", values: ["flutter"] }],
    effect: { property: "drape", min: mid, strength: "must" },
    priority: highPriority,
    reason: {
      ar: "الكم الفراشة يحتاج خامة سائبة ليتحرك بنعومة",
      en: "A flutter sleeve needs a draping fabric to move softly",
    },
  },
  {
    id: "collar-body",
    when: [{ path: "neckline.collar", op: "in", values: ["peter-pan", "shirt", "mandarin"] }],
    effect: { property: "body", min: high, strength: "prefer" },
    priority: highPriority,
    reason: {
      ar: "الياقة تحتاج خامة متماسكة لتقف في مكانها",
      en: "A collar needs a crisp fabric to stand properly",
    },
  },
  {
    id: "collar-not-limp",
    when: [{ path: "neckline.collar", op: "in", values: ["peter-pan", "shirt", "mandarin"] }],
    effect: { property: "body", min: low, strength: "must" },
    priority: highPriority,
    reason: {
      ar: "الخامة الرخوة جدا لا تحمل الياقة حتى مع الدك",
      en: "A very limp fabric cannot carry a collar, even with interfacing",
    },
  },
  {
    id: "lining-not-heavy",
    when: [{ path: "lining", op: "is-true" }],
    effect: { property: "weight", max: mid, strength: "prefer" },
    priority: lowPriority,
    reason: {
      ar: "البطانة تضيف وزنا، لذلك الأفضل خامة غير ثقيلة",
      en: "A lining adds weight, so a not-heavy outer fabric is better",
    },
  },
  {
    id: "pleats-hold",
    when: [{ path: "skirt.type", op: "in", values: ["pleated"] }],
    effect: { property: "body", min: mid, strength: "must" },
    priority: decisive,
    reason: {
      ar: "الطيات تحتاج خامة تثبت الكي وتحافظ على حدة الطية",
      en: "Pleats need a fabric that holds a crease",
    },
  },
  {
    id: "straight-skirt-body",
    when: [{ path: "skirt.type", op: "in", values: ["straight", "a-line"] }],
    effect: { property: "body", min: mid, strength: "prefer" },
    priority: medium,
    reason: {
      ar: "التنورة المستقيمة تحتاج خامة متماسكة حتى لا تتجعد عند الجلوس",
      en: "A straight skirt needs some body so it does not wrinkle when sitting",
    },
  },
  {
    id: "pockets-opaque",
    when: [{ path: "pockets", op: "in", values: ["side-seam", "patch"] }],
    effect: { property: "weight", min: low, strength: "must" },
    priority: medium,
    reason: {
      ar: "الجيب يظهر من خلف الخامة الشفافة جدا",
      en: "The pocket shows through a very sheer fabric",
    },
  },
  {
    id: "patch-pocket-body",
    when: [{ path: "pockets", op: "in", values: ["patch"] }],
    effect: { property: "body", min: mid, strength: "prefer" },
    priority: lowPriority,
    reason: {
      ar: "الجيب الخارجي يحتاج خامة متماسكة ليبقى مسطحا",
      en: "A patch pocket needs a fabric with body to sit flat",
    },
  },
  {
    id: "long-skirt-light",
    when: [{ path: "skirt.length", op: "in", values: ["ankle", "floor"] }],
    effect: { property: "weight", max: mid, strength: "prefer" },
    priority: lowPriority,
    reason: {
      ar: "الطول الكبير في خامة ثقيلة يزيد الوزن على الخصر",
      en: "A long skirt in a heavy fabric adds weight at the waist",
    },
  },
  {
    id: "self-tie-belt-drape",
    when: [{ path: "belt", op: "in", values: ["self-tie"] }],
    effect: { property: "drape", min: mid, strength: "prefer" },
    priority: lowPriority,
    reason: { ar: "حزام الربط يحتاج خامة تنعقد بنعومة", en: "A tie belt needs a fabric that knots softly" },
  },
  {
    id: "button-closure-body",
    when: [{ path: "closure.type", op: "in", values: ["buttons"] }],
    effect: { property: "body", min: mid, strength: "prefer" },
    priority: lowPriority,
    reason: {
      ar: "فتحة الأزرار تحتاج خامة متماسكة حتى لا تتموج",
      en: "A button placket needs a fabric with body so it does not ripple",
    },
  },
  {
    id: "waistband-body",
    when: [{ path: "waistband", op: "in", values: ["straight", "contour"] }],
    effect: { property: "body", min: mid, strength: "prefer" },
    priority: lowPriority,
    reason: {
      ar: "حزام الوسط يحتاج خامة متماسكة ليحمل الشكل",
      en: "A waistband needs a fabric with body to hold its shape",
    },
  },
];

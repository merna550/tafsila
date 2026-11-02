/** Drizzle mirror of the SQL tables the API uses (supabase/migrations is the source of truth; schema.test.ts compares the columns). */
import type {
  BilingualText,
  DesignSpec,
  SpecPatch,
  FabricCalcResult,
  FabricOptions,
  FabricProperties,
  Measurements,
  RuleCondition,
  RuleEffect,
  SizeChart,
} from "@tafsila/schemas";
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  smallint,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/** public.clients */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull(),
    name: text("name").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.id, table.ownerId)],
);

/** public.measurement_sets */
export const measurementSets = pgTable(
  "measurement_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull(),
    clientId: uuid("client_id"),
    label: text("label").notNull(),
    sizeLabel: text("size_label"),
    data: jsonb("data").$type<Measurements>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.clientId, table.ownerId], foreignColumns: [clients.id, clients.ownerId] }),
  ],
);

/** public.size_charts */
export const sizeCharts = pgTable("size_charts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sizes: jsonb("sizes").$type<SizeChart>().notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  ownerId: uuid("owner_id"),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** public.profiles. The API reads and changes only `name` and `locale` (column grants); the other columns are mirrored for completeness. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  phone: text("phone"),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true, mode: "date" }),
  locale: text("locale", { enum: ["ar", "en"] }).notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** public.admin_audit. The API only inserts (as an admin, `who` = the caller); the table is append-only. */
export const adminAudit = pgTable("admin_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  who: uuid("who"),
  action: text("action").notNull(),
  target: text("target"),
  before: jsonb("before"),
  after: jsonb("after"),
  at: timestamp("at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** public.designs. The API sets `updatedAt` on every update (there is no trigger). */
export const designs = pgTable(
  "designs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull(),
    category: text("category", { enum: ["dress", "skirt", "blouse"] }).notNull(),
    title: text("title").notNull(),
    photoPaths: text("photo_paths").array().notNull().default([]),
    analysis: jsonb("analysis"),
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.id, table.ownerId)],
);

/** public.pattern_versions. Append-only (select and insert only); `input_hash` is not unique, the API dedupes against the current version. */
export const patternVersions = pgTable(
  "pattern_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id").notNull(),
    ownerId: uuid("owner_id").notNull(),
    versionNo: integer("version_no").notNull(),
    spec: jsonb("spec").$type<DesignSpec>().notNull(),
    measurementSetId: uuid("measurement_set_id"),
    measurements: jsonb("measurements").$type<Measurements>().notNull(),
    sizeLabel: text("size_label"),
    easeProfile: text("ease_profile", { enum: ["fitted", "regular", "loose"] }).notNull(),
    options: jsonb("options").notNull().default({}),
    engineVersion: text("engine_version").notNull(),
    validationStatus: text("validation_status", { enum: ["pass", "warn"] }).notNull(),
    inputHash: text("input_hash").notNull(),
    createdBy: text("created_by", { enum: ["user", "chat"] })
      .notNull()
      .default("user"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.designId, table.versionNo),
    unique().on(table.id, table.ownerId),
    foreignKey({ columns: [table.designId, table.ownerId], foreignColumns: [designs.id, designs.ownerId] }),
    index().on(table.designId, table.inputHash),
  ],
);

/** public.fabrics. Read by every signed-in user, written by admins only (RLS); the API sets `updatedAt`. */
export const fabrics = pgTable("fabrics", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  properties: jsonb("properties").$type<FabricProperties>().notNull(),
  careNotes: jsonb("care_notes").$type<BilingualText>().notNull(),
  isDraft: boolean("is_draft").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedBy: uuid("updated_by"),
});

/** public.fabric_rules. `condition` is the package's `when`, `requiredProperties` its `effect`. */
export const fabricRules = pgTable("fabric_rules", {
  id: text("id").primaryKey(),
  condition: jsonb("condition").$type<RuleCondition[]>().notNull(),
  requiredProperties: jsonb("required_properties").$type<RuleEffect>().notNull(),
  priority: smallint("priority").notNull(),
  reason: jsonb("reason").$type<BilingualText>().notNull(),
  isDraft: boolean("is_draft").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedBy: uuid("updated_by"),
});

/** public.fabric_calcs. One row per version and options hash; owner-only (RLS). */
export const fabricCalcs = pgTable(
  "fabric_calcs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patternVersionId: uuid("pattern_version_id").notNull(),
    ownerId: uuid("owner_id").notNull(),
    options: jsonb("options").$type<FabricOptions>().notNull(),
    optionsHash: text("options_hash").notNull(),
    result: jsonb("result").$type<FabricCalcResult>().notNull(),
    nestingVersion: text("nesting_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.patternVersionId, table.optionsHash),
    foreignKey({
      columns: [table.patternVersionId, table.ownerId],
      foreignColumns: [patternVersions.id, patternVersions.ownerId],
    }),
  ],
);

/** public.fabric_explanations. One row per version, language and catalogue state; owner-only (RLS, no admin read). */
export const fabricExplanations = pgTable(
  "fabric_explanations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patternVersionId: uuid("pattern_version_id").notNull(),
    ownerId: uuid("owner_id").notNull(),
    locale: text("locale", { enum: ["ar", "en"] }).notNull(),
    catalogueHash: text("catalogue_hash").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.patternVersionId, table.locale, table.catalogueHash),
    foreignKey({
      columns: [table.patternVersionId, table.ownerId],
      foreignColumns: [patternVersions.id, patternVersions.ownerId],
    }),
  ],
);

/** public.chat_messages. Owner-only (RLS, no admin read); only `applied_version_id` is updated after the insert. */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: bigint("seq", { mode: "number" }).notNull().generatedAlwaysAsIdentity(),
    designId: uuid("design_id").notNull(),
    ownerId: uuid("owner_id").notNull(),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    baseVersionId: uuid("base_version_id"),
    proposedPatch: jsonb("proposed_patch").$type<SpecPatch>(),
    changes: jsonb("changes").$type<BilingualText[]>().notNull().default([]),
    outcome: text("outcome", { enum: ["proposal", "unsupported", "none"] })
      .notNull()
      .default("none"),
    appliedVersionId: uuid("applied_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.designId, table.ownerId], foreignColumns: [designs.id, designs.ownerId] }),
    index().on(table.designId, table.seq),
  ],
);

/** public.products. Prices in piastres; read by everyone, written only by admin functions. */
export const products = pgTable("products", {
  code: text("code").primaryKey(),
  kind: text("kind", { enum: ["single", "pack", "subscription"] }).notNull(),
  pricePiastres: integer("price_piastres").notNull(),
  credits: integer("credits").notNull(),
  creditDays: integer("credit_days"),
  periodDays: integer("period_days"),
  maxClients: integer("max_clients"),
  chatPerDesign: integer("chat_per_design").notNull(),
  active: boolean("active").notNull().default(true),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
});

/** public.credit_ledger. Read-only for users; written by private.grant_credits / consume_credit. Debits point at their lot. */
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    delta: integer("delta").notNull(),
    reason: text("reason", {
      enum: ["trial", "purchase", "subscription", "pattern", "admin", "refund"],
    }).notNull(),
    refId: text("ref_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    lotId: uuid("lot_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index().on(table.userId, table.expiresAt)],
);

/** public.subscriptions. One active row per user (partial unique index in SQL). */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  productCode: text("product_code").notNull(),
  status: text("status", { enum: ["active", "expired", "cancelled"] }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** public.payments. Status changes only through private.record_payment. */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  productCode: text("product_code").notNull(),
  amountPiastres: integer("amount_piastres").notNull(),
  currency: text("currency").notNull().default("EGP"),
  status: text("status", { enum: ["pending", "paid", "failed", "refunded"] })
    .notNull()
    .default("pending"),
  method: text("method", { enum: ["card", "wallet", "kiosk", "fake"] }).notNull(),
  paymobOrderId: text("paymob_order_id"),
  paymobTransactionId: text("paymob_transaction_id"),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" }),
});

/** Drizzle mirror of the SQL tables the API uses (supabase/migrations is the source of truth; schema.test.ts compares the columns). */
import type {
  BilingualText,
  DesignSpec,
  FabricCalcResult,
  FabricOptions,
  FabricProperties,
  Measurements,
  RuleCondition,
  RuleEffect,
  SizeChart,
} from "@tafsila/schemas";
import {
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

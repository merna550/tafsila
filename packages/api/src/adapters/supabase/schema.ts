/** Drizzle mirror of the SQL tables the API uses (supabase/migrations is the source of truth; schema.test.ts compares the columns). */
import type { Measurements } from "@tafsila/schemas";
import { foreignKey, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

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

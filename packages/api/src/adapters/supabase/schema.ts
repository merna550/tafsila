/** Drizzle mirror of the SQL tables the API uses (supabase/migrations is the source of truth; schema.test.ts compares the columns). */
import type { Measurements, SizeChart } from "@tafsila/schemas";
import { boolean, foreignKey, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

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

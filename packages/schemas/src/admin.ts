/** Admin contracts for /api/admin/* (FR-ADM, issue #32): the users list, the stats and the default size chart editor. */
import { z } from "zod";
import { designSpecSchema, garmentCategorySchema } from "./design-spec";
import { measurementIssueSchema } from "./measurement-sets";
import { pageOf, pageQuerySchema } from "./pagination";
import { sizeChartSchema } from "./size-chart";

/** Longest chart name and search text accepted. */
const MAX_CHART_NAME_LENGTH = 120;
const MAX_SEARCH_LENGTH = 100;

/** A chart whose name starts with this word holds demo values, not the real Egyptian chart. */
export const PLACEHOLDER_CHART_PREFIX = "PLACEHOLDER";

/**
 * Tells whether a chart still holds demo values (the admin screen shows a banner until the real chart is saved).
 *
 * @param name - Chart name.
 * @returns True when the name marks the chart as a placeholder.
 */
export function isPlaceholderChartName(name: string): boolean {
  return name.startsWith(PLACEHOLDER_CHART_PREFIX);
}

/** Numbers on the admin overview. */
export const adminStatsSchema = z.object({
  users: z.number().int().min(0).meta({ example: 42 }),
  verifiedPhones: z.number().int().min(0).meta({ example: 30 }),
  signupsToday: z.number().int().min(0).meta({ example: 2 }),
  signupsLast7Days: z.number().int().min(0).meta({ example: 9 }),
  clients: z.number().int().min(0).meta({ example: 120 }),
});

/** Parsed admin stats. */
export type AdminStats = z.infer<typeof adminStatsSchema>;

/** One user row of the admin list: contact data and a client count, never measurements or notes (NFR-05). */
export const adminUserSchema = z.object({
  id: z.uuid().meta({ example: "00000000-0000-4000-8000-000000000001" }),
  name: z.string().nullable().meta({ example: "منى أحمد" }),
  email: z.string().nullable().meta({ example: "mona@example.com" }),
  phone: z.string().nullable().meta({ example: "+201000000001" }),
  phoneVerifiedAt: z.iso.datetime().nullable().meta({ example: "2026-10-11T10:00:00.000Z" }),
  createdAt: z.iso.datetime().meta({ example: "2026-10-11T10:00:00.000Z" }),
  lastSignInAt: z.iso.datetime().nullable().meta({ example: "2026-10-12T08:30:00.000Z" }),
  clientCount: z.number().int().min(0).meta({ example: 3 }),
});

/** Parsed admin list row. */
export type AdminUser = z.infer<typeof adminUserSchema>;

/** One user in the read-only detail page: the list row plus counts and settings. */
export const adminUserDetailSchema = adminUserSchema.extend({
  measurementSetCount: z.number().int().min(0).meta({ example: 5 }),
  locale: z.enum(["ar", "en"]).meta({ example: "ar" }),
  role: z.enum(["user", "admin"]).meta({ example: "user" }),
});

/** Parsed admin user detail. */
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

/** Query of GET /api/admin/users. */
export const listAdminUsersQuerySchema = pageQuerySchema.extend({
  q: z
    .string()
    .trim()
    .max(MAX_SEARCH_LENGTH)
    .optional()
    .meta({ example: "mona", description: "Search in name, e-mail and phone" }),
  verified: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
    .meta({ example: "true", description: "Only users with (true) or without (false) a verified phone" }),
});

/** Parsed admin list query (`verified` is a boolean after parsing). */
export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;

/** One page of the admin users list. */
export const adminUserPageSchema = pageOf(adminUserSchema);

/** The default size chart as the admin editor reads it. */
export const adminSizeChartSchema = z.object({
  id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000d1" }),
  name: z.string().min(1).meta({ example: "Egyptian size chart" }),
  sizes: sizeChartSchema,
  updatedAt: z.iso.datetime().nullable().meta({ example: "2026-10-14T09:00:00.000Z" }),
  updatedBy: z
    .string()
    .nullable()
    .meta({ example: "Merna", description: "Display name of the last editor; null when unknown" }),
  isPlaceholder: z.boolean().meta({ description: "True while the chart still holds demo values" }),
});

/** Parsed admin size chart. */
export type AdminSizeChart = z.infer<typeof adminSizeChartSchema>;

/** Body of PUT /api/admin/size-charts/default. */
export const updateSizeChartInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(MAX_CHART_NAME_LENGTH)
    .optional()
    .meta({ example: "Egyptian size chart" }),
  sizes: sizeChartSchema,
});

/** Parsed size chart update body. */
export type UpdateSizeChartInput = z.infer<typeof updateSizeChartInputSchema>;

/** A measurement problem inside one size of the chart. */
export const sizeChartIssueSchema = measurementIssueSchema.extend({
  size: z.string().meta({ example: "M" }),
});

/** Parsed size chart issue. */
export type SizeChartIssue = z.infer<typeof sizeChartIssueSchema>;

/** Response of PUT /api/admin/size-charts/default: the saved chart and the warnings it was saved with. */
export const updateSizeChartResponseSchema = adminSizeChartSchema.extend({
  warnings: z.array(sizeChartIssueSchema),
});

/** Parsed size chart update response. */
export type UpdateSizeChartResponse = z.infer<typeof updateSizeChartResponseSchema>;

/** Query of the admin design and unsupported-feature lists: paging only. */
export const adminPageQuerySchema = pageQuerySchema;

/** Parsed paging query of the admin design lists. */
export type AdminPageQuery = z.infer<typeof adminPageQuerySchema>;

/** One photo of a shared design: the storage path and a 5-minute signed read URL. */
export const adminSharedPhotoSchema = z.object({
  path: z.string().meta({ example: "u1/d1/front.jpg" }),
  url: z.string().meta({
    example: "https://example.supabase.co/storage/v1/object/sign/design-photos/u1/d1/front.jpg?token=t",
  }),
});

/** A design whose owner agreed to share: the current spec and photos, never measurements, clients or notes (FR-ADM-03, #369). */
export const adminSharedDesignSchema = z.object({
  designId: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000d2" }),
  category: garmentCategorySchema.meta({ example: "dress" }),
  title: z.string().meta({ example: "فستان سهرة" }),
  currentSpec: designSpecSchema,
  createdAt: z.iso.datetime().meta({ example: "2026-11-03T10:00:00.000Z" }),
  ownerDisplayName: z.string().nullable().meta({ example: "Pro Workshop" }),
  photos: z.array(adminSharedPhotoSchema),
});

/** Parsed shared design. */
export type AdminSharedDesign = z.infer<typeof adminSharedDesignSchema>;

/** One page of shared designs. */
export const adminSharedDesignPageSchema = pageOf(adminSharedDesignSchema);

/** An unsupported-feature text with its garment category; no user id and no design id (#369). */
export const adminUnsupportedFeatureSchema = z.object({
  text: z.string().meta({ example: "detachable bow at the neckline" }),
  category: garmentCategorySchema.meta({ example: "dress" }),
  createdAt: z.iso.datetime().meta({ example: "2026-11-03T10:00:00.000Z" }),
});

/** Parsed unsupported-feature row. */
export type AdminUnsupportedFeature = z.infer<typeof adminUnsupportedFeatureSchema>;

/** One page of unsupported features. */
export const adminUnsupportedFeaturePageSchema = pageOf(adminUnsupportedFeatureSchema);

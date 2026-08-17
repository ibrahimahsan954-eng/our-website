import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Project inquiries submitted through the landing page request form.
    projectInquiries: defineTable({
      name: v.string(),
      email: v.string(),
      company: v.optional(v.string()),
      projectType: v.string(),
      budget: v.string(),
      timeline: v.string(),
      message: v.string(),
      phone: v.optional(v.string()),
      reference: v.optional(v.string()),
      status: v.union(v.literal("new"), v.literal("archived")),
      readAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_status", ["status", "createdAt"])
      .index("by_email", ["email"]),

    // Uploaded MP4 video assets (hero showreel + portfolio projects), keyed by
    // slot name ("showreel" | "project-N"). The landing page reads these as
    // native <video> overrides over the default YouTube sources.
    // IP-based rate limiting for public submission endpoints (booking form).
    // One row per rate-limit key ("ip:<address>") tracking the current hourly
    // window and how many submissions have been counted in it.
    rateLimits: defineTable({
      key: v.string(),
      windowStart: v.number(),
      count: v.number(),
      updatedAt: v.number(),
    }).index("by_key", ["key"]),

    videoAssets: defineTable({
      slot: v.string(),
      url: v.string(),
      fileName: v.string(),
      updatedAt: v.number(),
    }).index("by_slot", ["slot"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;

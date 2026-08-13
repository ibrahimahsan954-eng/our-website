import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public mutation — anyone can submit a project inquiry from the landing page.
 * No auth required so visitors don't need an account to reach out.
 */
export const submitInquiry = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    projectType: v.string(),
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim();
    const message = args.message.trim();

    if (name.length === 0 || name.length > 120) {
      throw new Error("Please provide your name.");
    }
    if (email.length === 0 || email.length > 254 || !email.includes("@")) {
      throw new Error("Please provide a valid email address.");
    }
    if (message.length === 0 || message.length > 4000) {
      throw new Error("Please describe your project (max 4000 characters).");
    }

    await ctx.db.insert("projectInquiries", {
      name,
      email,
      company: args.company?.trim() || undefined,
      projectType: args.projectType,
      budget: args.budget || undefined,
      timeline: args.timeline || undefined,
      message,
      status: "new",
      createdAt: Date.now(),
    });
  },
});

/**
 * Owner-only query — lists inquiries newest first.
 */
export const listInquiries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db
      .query("projectInquiries")
      .withIndex("by_status", (q) => q.eq("status", "new"))
      .order("desc")
      .collect();
  },
});

/**
 * Owner-only mutation — archives an inquiry so it leaves the inbox.
 */
export const archiveInquiry = mutation({
  args: { id: v.id("projectInquiries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.id, { status: "archived" });
  },
});

/**
 * Owner-only mutation — toggles whether an inquiry has been read.
 */
export const markInquiryRead = mutation({
  args: { id: v.id("projectInquiries"), read: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.id, { readAt: args.read ? Date.now() : undefined });
  },
});

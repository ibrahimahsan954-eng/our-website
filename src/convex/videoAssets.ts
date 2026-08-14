import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOwnerUserId } from "./inquiries";

/**
 * Media slots the site can host: the hero showreel plus each portfolio
 * project (ids come from src/data/projects.ts).
 */
export const MEDIA_SLOTS = [
  "showreel",
  "project-1",
  "project-2",
  "project-3",
  "project-4",
] as const;

type Slot = (typeof MEDIA_SLOTS)[number];

/** Public: the landing page reads uploaded MP4 overrides (reactive). */
export const listVideoOverrides = query({
  args: {},
  handler: async (ctx) => {
    const assets = await ctx.db.query("videoAssets").collect();
    const bySlot: Record<string, { url: string; fileName: string }> = {};
    for (const asset of assets) {
      bySlot[asset.slot] = { url: asset.url, fileName: asset.fileName };
    }
    return bySlot;
  },
});

/** Owner-only: point a slot at an uploaded video. */
export const registerVideo = mutation({
  args: { slot: v.string(), url: v.string(), fileName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getOwnerUserId(ctx);
    if (userId === null) throw new Error("Not the site owner");
    if (!MEDIA_SLOTS.includes(args.slot as Slot)) {
      throw new Error("Unknown media slot.");
    }
    const existing = await ctx.db
      .query("videoAssets")
      .withIndex("by_slot", (q) => q.eq("slot", args.slot))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        url: args.url,
        fileName: args.fileName,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("videoAssets", {
        slot: args.slot,
        url: args.url,
        fileName: args.fileName,
        updatedAt: Date.now(),
      });
    }
  },
});

/** Owner-only: clear a slot back to the default YouTube/facade source. */
export const removeVideo = mutation({
  args: { slot: v.string() },
  handler: async (ctx, args) => {
    const userId = await getOwnerUserId(ctx);
    if (userId === null) throw new Error("Not the site owner");
    const existing = await ctx.db
      .query("videoAssets")
      .withIndex("by_slot", (q) => q.eq("slot", args.slot))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

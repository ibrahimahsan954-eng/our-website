import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import {
  internalMutation,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

/**
 * Resolve the current user id, but only when they're the site owner.
 *
 * The owner is identified by the OWNER_NOTIFICATION_EMAIL environment
 * variable (set in the project's Keys/API keys tab). While that variable is
 * unset, any authenticated user can access the inbox so the owner isn't
 * locked out before configuring it.
 */
export async function getOwnerUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (ownerEmail) {
    const user = await ctx.db.get(userId);
    if (!user || user.email !== ownerEmail) {
      return null;
    }
  }
  return userId;
}

// Limits enforced server-side before anything is written to the DB.
const MAX_NAME = 100;
const MAX_COMPANY = 100;
const MAX_PROJECT_TYPE = 100;
const MAX_BUDGET = 100;
const MAX_TIMELINE = 100;
const MAX_PHONE = 40;
const MAX_REFERENCE = 500;
const MAX_MESSAGE = 2000;

// Reasonably strict server-side email check: one or more non-space chars,
// an @, a domain with a dot, and a TLD of at least 2 letters.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Sanitize free text before storing: trim, strip control characters (keeping
// line breaks and tabs in messages), normalize line endings so a stray \r can't
// smuggle into an email header, and strip HTML tags / angle brackets so user
// input is stored as plain text that can never form markup in any render
// context (JSX or HTML email).
function sanitize(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

/**
 * IP-based rate limit for the booking form: at most `limit` submissions per
 * `windowMs` per IP. Runs as a mutation so the read-check-write is atomic —
 * concurrent submissions from the same IP are serialized and can't both slip
 * through. Called by the public HTTP action (src/convex/http.ts) after the
 * real client IP is extracted from the request headers.
 */
export const checkIpRateLimit = internalMutation({
  args: {
    ip: v.string(),
    limit: v.optional(v.number()),
    windowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    const windowMs = args.windowMs ?? 60 * 60 * 1000; // 1 hour
    const key = `ip:${args.ip}`;
    const now = Date.now();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    // First request, or the hourly window rolled over — start a fresh window.
    if (!existing || now - existing.windowStart >= windowMs) {
      if (existing) {
        await ctx.db.patch(existing._id, {
          windowStart: now,
          count: 1,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("rateLimits", {
          key,
          windowStart: now,
          count: 1,
          updatedAt: now,
        });
      }
      return { allowed: true };
    }

    // Already at the cap inside this window — reject.
    if (existing.count >= limit) {
      return { allowed: false };
    }

    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
      updatedAt: now,
    });
    return { allowed: true };
  },
});

/**
 * Internal mutation — only reachable through the public HTTP action at
 * POST /inquiry, which enforces the per-IP rate limit before delegating here.
 * Kept as a mutation (instead of doing everything in the HTTP action) so the
 * validation + DB insert run atomically on the primary.
 */
export const submitInquiry = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    projectType: v.string(),
    budget: v.string(),
    timeline: v.string(),
    message: v.string(),
    phone: v.optional(v.string()),
    reference: v.optional(v.string()),
    // Honeypot — bots fill this hidden field; real visitors never see it.
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Silently discard bot submissions that filled the honeypot field — and
    // pretend success so bots can't tell they were filtered.
    if (args.website && args.website.trim().length > 0) {
      return { success: true };
    }

    const name = sanitize(args.name);
    const email = sanitize(args.email).toLowerCase();
    const company = args.company ? sanitize(args.company) : "";
    const projectType = sanitize(args.projectType);
    const budget = sanitize(args.budget);
    const timeline = sanitize(args.timeline);
    const message = sanitize(args.message);
    const phone = args.phone ? sanitize(args.phone) : "";
    const reference = args.reference ? sanitize(args.reference) : "";

    // Server-side validation — runs before anything is written to the DB, so
    // invalid or empty submissions are rejected up front.
    if (name.length === 0 || name.length > MAX_NAME) {
      return { success: false, message: "Please provide your name (max 100 characters)." };
    }
    if (email.length === 0 || email.length > 254 || !EMAIL_RE.test(email)) {
      return { success: false, message: "Please provide a valid email address." };
    }
    if (company.length > MAX_COMPANY) {
      return { success: false, message: "Company name is limited to 100 characters." };
    }
    if (projectType.length === 0 || projectType.length > MAX_PROJECT_TYPE) {
      return { success: false, message: "Please tell us your niche (max 100 characters)." };
    }
    if (budget.length === 0 || budget.length > MAX_BUDGET) {
      return { success: false, message: "Please select a budget range." };
    }
    if (timeline.length === 0 || timeline.length > MAX_TIMELINE) {
      return { success: false, message: "Please select your timeline." };
    }
    if (phone.length > MAX_PHONE) {
      return { success: false, message: "Phone number is too long." };
    }
    if (reference.length > MAX_REFERENCE) {
      return { success: false, message: "References are limited to 500 characters." };
    }
    if (message.length === 0 || message.length > MAX_MESSAGE) {
      return {
        success: false,
        message: "Please describe your project (max 2000 characters).",
      };
    }

    // Rate limit: at most one submission per email every 60 seconds, so bots
    // can't flood the inbox or burn email credits. Returned as a clean
    // response instead of an exception so the client shows a friendly message.
    const latest = await ctx.db
      .query("projectInquiries")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .first();
    if (latest && Date.now() - latest.createdAt < 60_000) {
      return {
        success: false,
        message: "Thanks — please wait a moment before sending another request.",
      };
    }

    await ctx.db.insert("projectInquiries", {
      name,
      email,
      company: company || undefined,
      projectType,
      budget,
      timeline,
      message,
      phone: phone || undefined,
      reference: reference || undefined,
      status: "new",
      createdAt: Date.now(),
    });

    // Fire the emails after this mutation commits (visitor confirmation +
    // optional owner alert). Scheduler failures don't affect the saved inquiry.
    try {
      await ctx.scheduler.runAfter(0, api.emails.sendInquiryEmails, {
        name,
        email,
        company: company || undefined,
        projectType,
        budget,
        timeline,
        message,
        phone: phone || undefined,
        reference: reference || undefined,
      });
    } catch (error) {
      console.error("Failed to schedule inquiry emails:", error);
    }

    return { success: true };
  },
});

/**
 * Owner-only query — lists inquiries newest first.
 */
export const listInquiries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOwnerUserId(ctx);
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
    const userId = await getOwnerUserId(ctx);
    if (userId === null) {
      throw new Error("Not the site owner");
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
    const userId = await getOwnerUserId(ctx);
    if (userId === null) {
      throw new Error("Not the site owner");
    }
    await ctx.db.patch(args.id, { readAt: args.read ? Date.now() : undefined });
  },
});

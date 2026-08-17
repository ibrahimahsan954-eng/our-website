"use node";

import { vly } from "../lib/vly-integrations";
import { action } from "./_generated/server";
import { v } from "convex/values";

// Escape user-supplied text before it's interpolated into HTML email bodies,
// so any HTML/script tags submitted by users render as plain text and can
// never execute in a mail client. This is belt-and-suspenders on top of the
// storage-time sanitization in src/convex/inquiries.ts — it also protects
// rows that were stored before that sanitization existed.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Delivers one email.
 *
 * Primary channel — the VLY integration (Resend-backed, billed through the
 * platform's VLY_INTEGRATION_KEY, no separate Resend account needed).
 *
 * Fallback channel — Web3Forms (WEB3FORMS_ACCESS_KEY): if the VLY key is
 * missing or the send fails, the same message is POSTed to Web3Forms, which
 * forwards it to the inbox registered with that access key. This guarantees
 * owner notifications still arrive even if the primary provider is down or
 * unconfigured.
 *
 * Throws a descriptive error only when neither channel can deliver, so
 * failures surface in the Convex logs instead of silently vanishing.
 */
async function deliverEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<{ channel: "vly" | "web3forms" }> {
  const { to, subject, text, html, replyTo } = opts;
  const sender = process.env.VLY_EMAIL_FROM;

  if (process.env.VLY_INTEGRATION_KEY) {
    try {
      await vly.email.send({
        ...(sender ? { from: sender } : {}),
        to,
        subject,
        text,
        html,
        ...(replyTo ? { replyTo } : {}),
      });
      return { channel: "vly" };
    } catch (error) {
      console.error("[emails] VLY delivery failed, trying Web3Forms:", error);
    }
  }

  const web3Key = process.env.WEB3FORMS_ACCESS_KEY;
  if (!web3Key) {
    throw new Error(
      "No email provider is configured: set VLY_INTEGRATION_KEY (or WEB3FORMS_ACCESS_KEY) in the project's Keys/API keys tab.",
    );
  }

  const form = new FormData();
  form.append("access_key", web3Key);
  form.append("subject", subject);
  form.append("from_name", "Ebad Ahsan portfolio");
  form.append("_replyto", replyTo ?? to);
  form.append("email", to);
  form.append("message", text);
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    body: form,
  });
  const body = (await res.json().catch(() => null)) as {
    success?: boolean;
  } | null;
  if (!res.ok || body?.success === false) {
    throw new Error(`Web3Forms delivery failed (HTTP ${res.status}).`);
  }
  return { channel: "web3forms" };
}

/**
 * Emails triggered by a new project inquiry.
 *
 * 1. A confirmation to the visitor (via the primary VLY channel — Web3Forms
 *    can only deliver to the inbox registered with its key, not to arbitrary
 *    recipients).
 * 2. An instant notification to the site owner with all inquiry details,
 *    sent by default to onepunchman5005@gmail.com (override with the
 *    OWNER_NOTIFICATION_EMAIL env var in the project's Keys/API keys tab).
 *    This one falls back to Web3Forms so it always arrives.
 */
export const sendInquiryEmails = action({
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
  },
  handler: async (_ctx, args) => {
    const ownerEmail =
      process.env.OWNER_NOTIFICATION_EMAIL ?? "onepunchman5005@gmail.com";

    // Escaped copies of every user field, used only inside the HTML bodies.
    const safe = {
      name: escapeHtml(args.name),
      email: escapeHtml(args.email),
      company: escapeHtml(args.company || "—"),
      projectType: escapeHtml(args.projectType),
      budget: escapeHtml(args.budget),
      timeline: escapeHtml(args.timeline),
      message: escapeHtml(args.message),
      phone: escapeHtml(args.phone || "—"),
      reference: escapeHtml(args.reference || "—"),
    };

    const results: Record<string, unknown> = {};

    // 1. Confirmation to the visitor.
    try {
      results.confirmation = await deliverEmail({
        to: args.email,
        subject: "We received your project request — Ebad Ahsan",
        text: `Hi ${args.name},

Thanks for reaching out about your ${args.projectType || "project"}. I've received your request and will get back to you within 24 hours to talk scope, timeline, and budget.

In the meantime, feel free to message me on WhatsApp with any questions.

— Ebad Ahsan
Ebad Ahsan`,
        html: `<div style="background:#0d0d0d;padding:32px;font-family:Arial,sans-serif;color:#f2f4f6">
  <div style="max-width:480px;margin:0 auto">
    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em">Ebad<span style="color:#25D366">Ahsan</span></div>
    <h1 style="font-size:22px;color:#ffffff;margin:24px 0 8px">We received your project request</h1>
    <p style="font-size:15px;line-height:1.6;color:#cccccc;margin:0 0 16px">Thanks, <strong style="color:#ffffff">${safe.name}</strong> — I've got your ${safe.projectType || "project"} inquiry and will get back to you within 24 hours to talk scope, timeline, and budget.</p>
    <p style="font-size:13px;line-height:1.6;color:#86868b;margin:0">Prefer to chat right away? Message me on <strong style="color:#a1a1a6">WhatsApp</strong> with any questions.</p>
  </div>
</div>`,
      });
    } catch (error) {
      // The inquiry is already saved; the owner notification below is the
      // critical one, so a confirmation failure must not block it.
      console.error("[emails] Visitor confirmation failed:", error);
      results.confirmation = { error: "delivery failed" };
    }

    // 2. Owner notification — VLY primary, Web3Forms fallback. If both fail
    //    this throws, so the failure is visible in the Convex logs.
    results.owner = await deliverEmail({
      to: ownerEmail,
      replyTo: args.email,
      subject: `New inquiry: ${args.name} — ${args.projectType}`,
      text: `New project inquiry received

Name: ${args.name}
Email: ${args.email}
Company: ${args.company || "—"}
Phone: ${args.phone || "—"}
Project type (niche): ${args.projectType}
Budget: ${args.budget}
Timeline: ${args.timeline}
Reference / inspiration: ${args.reference || "—"}

Project details / links:
${args.message}

Reply to ${args.email} to follow up.`,
      html: `<div style="background:#0d0d0d;padding:32px;font-family:Arial,sans-serif;color:#f2f4f6">
  <div style="max-width:480px;margin:0 auto">
    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em">Ebad<span style="color:#25D366">Ahsan</span></div>
    <h1 style="font-size:20px;color:#ffffff;margin:24px 0 12px">New project inquiry</h1>
    <table style="width:100%;font-size:14px;color:#cccccc;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#86868b">Name</td><td style="padding:6px 0;color:#ffffff">${safe.name}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Email</td><td style="padding:6px 0;color:#ffffff">${safe.email}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Company</td><td style="padding:6px 0;color:#ffffff">${safe.company}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Phone</td><td style="padding:6px 0;color:#ffffff">${safe.phone}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Project type (niche)</td><td style="padding:6px 0;color:#ffffff">${safe.projectType}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Budget</td><td style="padding:6px 0;color:#ffffff">${safe.budget}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Timeline</td><td style="padding:6px 0;color:#ffffff">${safe.timeline}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Reference / inspiration</td><td style="padding:6px 0;color:#ffffff">${safe.reference}</td></tr>
    </table>
    <p style="font-size:12px;color:#86868b;margin:16px 0 4px">Project details / links</p>
    <p style="font-size:14px;line-height:1.6;color:#ffffff;margin:0;padding-top:12px;border-top:1px solid #2a2a2a;white-space:pre-wrap">${safe.message}</p>
    <p style="font-size:12px;color:#86868b;margin:20px 0 0">Reply to <a href="mailto:${safe.email}" style="color:#25D366">${safe.email}</a> to follow up.</p>
  </div>
</div>`,
    });

    return results;
  },
});

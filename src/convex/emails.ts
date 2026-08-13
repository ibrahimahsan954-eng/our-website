"use node";

import { vly } from "../lib/vly-integrations";
import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Emails triggered by a new project inquiry.
 *
 * 1. A confirmation to the visitor (uses the VLY email integration — no extra
 *    API key needed, it bills through the platform integration key).
 * 2. A notification to the site owner, only when the OWNER_NOTIFICATION_EMAIL
 *    environment variable is set in the project's Keys/API keys tab.
 */
export const sendInquiryEmails = action({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    projectType: v.string(),
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    const sender = process.env.VLY_EMAIL_FROM;
    const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;

    const results: Record<string, unknown> = {};

    // 1. Confirmation to the visitor.
    const confirm = await vly.email.send({
      ...(sender ? { from: sender } : {}),
      to: args.email,
      subject: "We received your project request — Ebad Ahsan",
      text: `Hi ${args.name},

Thanks for reaching out about your ${args.projectType || "project"}. I've received your request and will get back to you within 24 hours to talk scope, timeline, and budget.

In the meantime, feel free to message me on WhatsApp with any questions.

— Ebad Ahsan
Ebad Ahsan`,
      html: `<div style="background:#0d0d0d;padding:32px;font-family:Arial,sans-serif;color:#f2f4f6">
  <div style="max-width:480px;margin:0 auto">
    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em">Ebad<span style="color:#71b25c">Ahsan</span></div>
    <h1 style="font-size:22px;color:#ffffff;margin:24px 0 8px">We received your project request</h1>
    <p style="font-size:15px;line-height:1.6;color:#cccccc;margin:0 0 16px">Thanks, <strong style="color:#ffffff">${args.name}</strong> — I've got your ${args.projectType || "project"} inquiry and will get back to you within 24 hours to talk scope, timeline, and budget.</p>
    <p style="font-size:13px;line-height:1.6;color:#86868b;margin:0">Prefer to chat right away? Message me on <strong style="color:#a1a1a6">WhatsApp</strong> with any questions.</p>
  </div>
</div>`,
    });
    results.confirmation = confirm;

    // 2. Owner notification (only if an owner email is configured).
    if (ownerEmail) {
      const owner = await vly.email.send({
        ...(sender ? { from: sender } : {}),
        to: ownerEmail,
        replyTo: args.email,
        subject: `New inquiry: ${args.name} — ${args.projectType}`,
        text: `New project inquiry received

Name: ${args.name}
Email: ${args.email}
Company: ${args.company || "—"}
Project type: ${args.projectType}
Budget: ${args.budget || "—"}
Timeline: ${args.timeline || "—"}

Message:
${args.message}

Reply to ${args.email} to follow up.`,
        html: `<div style="background:#0d0d0d;padding:32px;font-family:Arial,sans-serif;color:#f2f4f6">
  <div style="max-width:480px;margin:0 auto">
    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em">Ebad<span style="color:#71b25c">Ahsan</span></div>
    <h1 style="font-size:20px;color:#ffffff;margin:24px 0 12px">New project inquiry</h1>
    <table style="width:100%;font-size:14px;color:#cccccc;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#86868b">Name</td><td style="padding:6px 0;color:#ffffff">${args.name}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Email</td><td style="padding:6px 0;color:#ffffff">${args.email}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Company</td><td style="padding:6px 0;color:#ffffff">${args.company || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Project type</td><td style="padding:6px 0;color:#ffffff">${args.projectType}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Budget</td><td style="padding:6px 0;color:#ffffff">${args.budget || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">Timeline</td><td style="padding:6px 0;color:#ffffff">${args.timeline || "—"}</td></tr>
    </table>
    <p style="font-size:14px;line-height:1.6;color:#ffffff;margin:16px 0 0;padding-top:16px;border-top:1px solid #2a2a2a;white-space:pre-wrap">${args.message}</p>
    <p style="font-size:12px;color:#86868b;margin:20px 0 0">Reply to <a href="mailto:${args.email}" style="color:#71b25c">${args.email}</a> to follow up.</p>
  </div>
</div>`,
      });
      results.owner = owner;
    }

    return results;
  },
});

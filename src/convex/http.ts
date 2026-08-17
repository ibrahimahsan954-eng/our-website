import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);

// CORS — the booking form posts cross-origin from the web app to the Convex
// site URL, so every response (including the OPTIONS preflight) must allow it.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// Best-effort client IP: Cloudflare first, then the standard forwarded header
// (leftmost entry is the original client), then x-real-ip. Falls back to
// "unknown" so the rate limiter still functions behind proxies that strip IPs.
function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Browser CORS preflight for the booking form POST.
http.route({
  path: "/inquiry",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: CORS_HEADERS })),
});

/**
 * Public booking-form endpoint. Enforces the per-IP rate limit (max 3
 * submissions per hour) before delegating to the internal submitInquiry
 * mutation, which re-validates, stores the inquiry, and schedules the emails.
 */
http.route({
  path: "/inquiry",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse({ success: false, message: "Invalid request." }, 400);
    }

    // Honeypot — bots fill this hidden field; real visitors never see it.
    // Silently discard and pretend success so bots can't tell they're filtered.
    const website = typeof body.website === "string" ? body.website.trim() : "";
    if (website.length > 0) {
      return jsonResponse({ success: true });
    }

    // IP-based rate limiting: 3 submissions per hour per address.
    const ip = getClientIp(request);
    const rateLimit = await ctx.runMutation(
      internal.inquiries.checkIpRateLimit,
      { ip },
    );
    if (!rateLimit.allowed) {
      return jsonResponse(
        {
          success: false,
          message:
            "Too many submissions from this device — please try again in an hour.",
        },
        429,
      );
    }

    // Coerce to strings and delegate to the internal mutation, which runs the
    // full server-side validation before writing anything to the database.
    const str = (value: unknown): string =>
      typeof value === "string" ? value : "";
    const result = await ctx.runMutation(
      internal.inquiries.submitInquiry,
      {
        name: str(body.name),
        email: str(body.email),
        company: str(body.company) || undefined,
        projectType: str(body.projectType),
        budget: str(body.budget),
        timeline: str(body.timeline),
        message: str(body.message),
        phone: str(body.phone) || undefined,
        reference: str(body.reference) || undefined,
        website: website || undefined,
      },
    );

    return jsonResponse(result, result.success ? 200 : 400);
  }),
});

export default http;

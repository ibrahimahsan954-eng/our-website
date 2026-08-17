import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { validateFormFile } from "./uploadRules";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Same-origin restriction for the booking form.
 *
 * Browser requests from other websites carry an Origin header that won't match
 * this site, so they're rejected (403) before anything else runs. Requests
 * without an Origin header (curl, servers, most bots) pass this check — they
 * are still gated by the honeypot and the per-IP rate limit.
 *
 * Allowed origins:
 *   - local dev (localhost / 127.0.0.1)
 *   - any origin in the ALLOWED_ORIGINS env var (comma-separated) — set this
 *     in the project's Keys/API keys tab for production domains
 *   - *.vly.sh (this platform's preview domain family) as a configuration-free
 *     default — set ALLOWED_ORIGINS to restrict further
 */
const LOCAL_ORIGIN_PREFIXES = ["http://localhost:", "http://127.0.0.1:"];

function originAllowed(origin: string | null): boolean {
  if (!origin) return true; // non-browser clients — honeypot + rate limit handle them
  const normalized = origin.trim().toLowerCase();
  if (LOCAL_ORIGIN_PREFIXES.some((p) => normalized.startsWith(p))) return true;

  const configured = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (configured.includes(normalized)) return true;

  try {
    const hostname = new URL(normalized).hostname;
    if (hostname === "localhost" || hostname.endsWith(".vly.sh")) return true;
  } catch {
    // Malformed origin — treated as not allowed.
  }
  return false;
}

// CORS — only reflect the origin back when it's one of our own, so other
// websites' browsers get no permission to read responses (and their preflight
// fails, blocking the cross-origin POST entirely).
function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !originAllowed(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
  origin: string | null = null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
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

// Browser CORS preflight for the booking form POST. Cross-origin preflights
// get a bare 403 (no CORS headers), which makes the browser abort the POST.
http.route({
  path: "/inquiry",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    const origin = request.headers.get("origin");
    if (!originAllowed(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }),
});

/**
 * Public booking-form endpoint. Enforces, in order: honeypot (silently
 * discard bots), same-origin restriction, per-IP rate limit (max 3 per hour),
 * optional file-type/size guardrails, then delegates to the internal
 * submitInquiry mutation, which re-validates, stores, and schedules emails.
 */
http.route({
  path: "/inquiry",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin");

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse({ success: false, message: "Invalid request." }, 400, origin);
    }

    // Honeypot — bots fill this hidden field; real visitors never see it.
    // Silently discard and pretend success so bots can't tell they're filtered.
    const website = typeof body.website === "string" ? body.website.trim() : "";
    if (website.length > 0) {
      return jsonResponse({ success: true }, 200, origin);
    }

    // Same-origin restriction — reject browser requests from other websites.
    if (!originAllowed(origin)) {
      return jsonResponse(
        { success: false, message: "Request blocked." },
        403,
        origin,
      );
    }

    // Optional file guardrails — if the form ever sends an upload, only
    // JPG/PNG/PDF up to 5 MB is accepted; anything else is rejected here.
    const rawFile = body.file;
    if (rawFile && typeof rawFile === "object") {
      const file = rawFile as { name?: unknown; size?: unknown; type?: unknown };
      const fileName = typeof file.name === "string" ? file.name : "";
      const sizeBytes = typeof file.size === "number" ? file.size : -1;
      const contentType =
        typeof file.type === "string" ? file.type : undefined;
      const fileCheck = validateFormFile(fileName, sizeBytes, contentType);
      if (!fileCheck.ok) {
        return jsonResponse(
          { success: false, message: fileCheck.message },
          400,
          origin,
        );
      }
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
        origin,
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

    return jsonResponse(result, result.success ? 200 : 400, origin);
  }),
});

export default http;

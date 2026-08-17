import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

// Basic security headers on every response.
// - X-Frame-Options: DENY (plus CSP frame-ancestors 'none') prevents
//   clickjacking — the site can never be embedded in another page's iframe.
// - Content-Security-Policy restricts which origins scripts, frames, fonts,
//   and connections can come from. The 'sha256-...' entry allows the small
//   inline theme script in index.html; everything else must load from the
//   site itself. Video embeds, the Google/SF Pro font CDNs, the Convex
//   backend (cloud + site URLs), and the booking endpoint are allowlisted.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'sha256-8a4ae73aa2ed9e19a2939b2891b42182f8de158444084e83d50a88915da81b63'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com",
  "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://player.cloudinary.com https://cal.com https://app.cal.com https://calendly.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

app.use("*", async (c, next) => {
  await next();
  c.header("X-Frame-Options", "DENY");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Content-Security-Policy", CSP);
});

// 1) Serve anything in /assets/**
app.use("/assets/*", serveStatic({ root: "./dist/assets" }));

// 2) Catch *all* other files in dist (CSS, JS, images, etc.)
app.use("*", serveStatic({ root: "./dist" }));

// 3) Fallback to index.html for the SPA
app.get("*", serveStatic({ path: "./dist/index.html" }));

Deno.serve(app.fetch);

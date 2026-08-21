import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

// Basic security headers on every response.
// - X-Frame-Options: DENY (plus CSP frame-ancestors 'none') prevents
//   clickjacking — the site can never be embedded in another page's iframe.
// - Content-Security-Policy restricts which origins scripts, frames, fonts,
//   and connections can come from. The 'sha256-...' entry allows the small
//   inline theme script in index.html (stricter than 'unsafe-inline' — only
//   that exact script runs); the Plausible/GTM hosts allow the analytics
//   snippet. connect-src permits any HTTPS/WSS origin so the Convex backend,
//   the Web3Forms fallback, the presigned S3/R2 upload host (configured per
//   deploy), and the Plausible beacon all work — but never plaintext http:/ws:.
//   Kept in sync with the meta policy in index.html.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'sha256-8a4ae73aa2ed9e19a2939b2891b42182f8de158444084e83d50a88915da81b63' https://plausible.io https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com",
  "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https: wss:",
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

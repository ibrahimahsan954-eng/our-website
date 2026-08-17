// Generates public/og-image.png (1200x630, for WhatsApp/Instagram/link
// previews) and public/favicon.png (512x512, favicon fallback + PWA icon)
// using the site's green-on-black play-button branding.
//
// Pure Node built-ins only (zlib) — no dependencies. The rasterizer renders at
// 2x and downsamples so edges are anti-aliased.
//
// Re-run with:  bun scripts/generate-og.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(OUT_DIR, { recursive: true });

/* ------------------------------ PNG encoder ------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------- Rasterizer ------------------------------ */

class Canvas {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  blend(x, y, r, g, b, a) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const na = 1 - a;
    this.data[i] = Math.round(this.data[i] * na + r * a);
    this.data[i + 1] = Math.round(this.data[i + 1] * na + g * a);
    this.data[i + 2] = Math.round(this.data[i + 2] * na + b * a);
    this.data[i + 3] = Math.round(this.data[i + 3] * na + 255 * a);
  }

  fillRect(x, y, w, h, r, g, b, a) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.ceil(x + w));
    const y1 = Math.min(this.h, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.blend(xx, yy, r, g, b, a);
  }

  fillTriangle(ax, ay, bx, by, cx, cy, r, g, b, a) {
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const maxX = Math.min(this.w, Math.ceil(Math.max(ax, bx, cx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const maxY = Math.min(this.h, Math.ceil(Math.max(ay, by, cy)));
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (area === 0) return;
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const w0 = ((bx - x) * (cy - ay) - (cx - x) * (by - ay)) / area;
        const w1 = ((cx - x) * (ay - by) - (ax - x) * (cy - by)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) this.blend(x, y, r, g, b, a);
      }
    }
  }

  // Signed distance to a rounded rect centered at (cx, cy), half-size hw/hh.
  sdRoundRect(px, py, cx, cy, hw, hh, rad) {
    const qx = Math.abs(px - cx) - (hw - rad);
    const qy = Math.abs(py - cy) - (hh - rad);
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - rad;
  }

  ring(cx, cy, hw, hh, rad, stroke, r, g, b, a) {
    const x0 = Math.max(0, Math.floor(cx - hw - stroke));
    const x1 = Math.min(this.w, Math.ceil(cx + hw + stroke));
    const y0 = Math.max(0, Math.floor(cy - hh - stroke));
    const y1 = Math.min(this.h, Math.ceil(cy + hh + stroke));
    const half = stroke / 2;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const d = Math.abs(this.sdRoundRect(x + 0.5, y + 0.5, cx, cy, hw, hh, rad));
        if (d <= half) {
          // Soft edge: fade the outermost pixel ring for smoother AA.
          const alpha = a * Math.min(1, half - d + 1);
          this.blend(x, y, r, g, b, alpha);
        }
      }
    }
  }

  radialGlow(cx, cy, radius, r, g, b, maxA) {
    const r2 = radius * radius;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const x1 = Math.min(this.w, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const y1 = Math.min(this.h, Math.ceil(cy + radius));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 <= r2) {
          const t = Math.sqrt(d2) / radius;
          this.blend(x, y, r, g, b, maxA * (1 - t * t));
        }
      }
    }
  }

  downscale(factor) {
    const w = this.w / factor;
    const h = this.h / factor;
    const out = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let dy = 0; dy < factor; dy++) {
          for (let dx = 0; dx < factor; dx++) {
            const i = ((y * factor + dy) * this.w + x * factor + dx) * 4;
            r += this.data[i];
            g += this.data[i + 1];
            b += this.data[i + 2];
            a += this.data[i + 3];
          }
        }
        const n = factor * factor;
        const o = (y * w + x) * 4;
        out[o] = r / n;
        out[o + 1] = g / n;
        out[o + 2] = b / n;
        out[o + 3] = a / n;
      }
    }
    return { width: w, height: h, data: out };
  }
}

/* ------------------------------- Bitmap font ------------------------------ */

const FONT = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#..##", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "#.##.", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "..##.", ".#...", "#....", "#####"],
  3: [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  4: ["#...#", "#...#", "#...#", "#####", "....#", "....#", "....#"],
  5: ["#####", "#....", "#....", "####.", "....#", "#...#", ".###."],
  6: [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  "&": ["..#..", ".#.#.", "#.#..", ".#...", "#.#.#", "#.#.#", ".#.#."],
  "|": ["..#..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", "..#..", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": ["..#..", "#.#.#", "#...#", "...#.", "..#..", ".....", "..#.."],
  "/": ["....#", "...#.", "..#..", ".#...", "#....", ".....", "....."],
};

function drawText(canvas, text, cx, cy, scale, r, g, b, a) {
  const cell = 6 * scale; // 5px glyph + 1px tracking
  const total = cell * text.length;
  let x = cx - total / 2;
  for (const ch of text) {
    const glyph = FONT[ch] ?? FONT[" "];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "#") {
          canvas.fillRect(x + col * scale, cy - 3.5 * scale + row * scale, scale, scale, r, g, b, a);
        }
      }
    }
    x += cell;
  }
}

const GREEN = [0x25, 0xd3, 0x66];
const BLACK = [0x0a, 0x0a, 0x0a];
const WHITE = [0xff, 0xff, 0xff];

/* ------------------------------ OG image (1200x630) ----------------------------- */

function renderOg() {
  const ss = 2;
  const canvas = new Canvas(1200 * ss, 630 * ss);

  // Background.
  canvas.fillRect(0, 0, canvas.w, canvas.h, ...BLACK, 1);

  // Ambient green glow behind the mark.
  canvas.radialGlow(600 * ss, 315 * ss, 560 * ss, ...GREEN, 0.16);

  // Rounded-square play-button ring.
  canvas.ring(600 * ss, 315 * ss, 124 * ss, 124 * ss, 32 * ss, 6.5 * ss, ...GREEN, 1);

  // Play triangle.
  canvas.fillTriangle(
    (600 - 58) * ss, (315 - 72) * ss,
    (600 - 58) * ss, (315 + 72) * ss,
    (600 + 76) * ss, 315 * ss,
    ...GREEN, 1,
  );

  // Headline + tagline.
  drawText(canvas, "EBAD AHSAN", 600 * ss, 158 * ss, 7 * ss, ...WHITE, 1);
  drawText(canvas, "VIDEO EDITOR & MOTION DESIGNER", 600 * ss, 468 * ss, 3 * ss, ...GREEN, 1);

  const out = canvas.downscale(ss);
  return encodePng(out.width, out.height, out.data);
}

/* ------------------------------- Favicon (512x512) ------------------------------ */

function renderFavicon() {
  const ss = 2;
  const size = 512 * ss;
  const canvas = new Canvas(size, size);

  canvas.fillRect(0, 0, size, size, ...BLACK, 1);
  canvas.radialGlow(256 * ss, 256 * ss, 340 * ss, ...GREEN, 0.14);
  canvas.ring(256 * ss, 256 * ss, 168 * ss, 168 * ss, 46 * ss, 13 * ss, ...GREEN, 1);
  canvas.fillTriangle(
    (256 - 78) * ss, (256 - 98) * ss,
    (256 - 78) * ss, (256 + 98) * ss,
    (256 + 104) * ss, 256 * ss,
    ...GREEN, 1,
  );

  const out = canvas.downscale(ss);
  return encodePng(out.width, out.height, out.data);
}

writeFileSync(join(OUT_DIR, "og-image.png"), renderOg());
writeFileSync(join(OUT_DIR, "favicon.png"), renderFavicon());
console.log("Wrote public/og-image.png and public/favicon.png");

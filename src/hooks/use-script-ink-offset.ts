import { useEffect, useState } from "react";

/**
 * Returns a translateX correction (in em of the element it is applied to) that
 * horizontally centers a script font's *visible ink*. Script fonts draw entry
 * and exit strokes outside their advance boxes, so a mathematically centered
 * <span> can still look shifted (e.g. Dancing Script's capital E/A sweep left
 * of their boxes, making the text read off-center).
 *
 * Instead of guessing, this renders the sample once to an offscreen canvas,
 * scans the drawn pixels for the true left/right ink bounds, and returns the
 * exact correction needed to center them. Positive = shift right.
 */
export function useScriptInkOffset(
  fontFamily: string,
  sample: string,
  weight = 700,
): number {
  const [offsetEm, setOffsetEm] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fontSize = 128;
    const font = `${weight} ${fontSize}px "${fontFamily}"`;

    const measure = async () => {
      try {
        if (typeof document === "undefined" || !document.fonts) return;
        // Wait for the webfont so we measure the real glyphs, not a fallback.
        await document.fonts.load(font);
        await document.fonts.ready;
        if (cancelled) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        // Measure the advance with the real webfont first...
        ctx.font = font;
        ctx.textBaseline = "middle";
        const advance = ctx.measureText(sample).width;

        // ...then size the canvas. IMPORTANT: assigning canvas.width/height
        // RESETS the 2D context state (including the font), so the font must
        // be re-applied afterward or the sample renders in the default 10px
        // sans-serif and the measured "ink" is meaningless.
        canvas.width = Math.max(4, Math.ceil(advance + fontSize * 3));
        canvas.height = Math.ceil(fontSize * 2);
        ctx.font = font;
        ctx.textBaseline = "middle";

        ctx.fillStyle = "#000";
        ctx.fillText(sample, canvas.width / 2, canvas.height / 2);

        const { data, width, height } = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        let minX = Infinity;
        let maxX = -Infinity;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Alpha > 16 catches thin antialiased swash strokes too.
            if (data[(y * width + x) * 4 + 3] > 16) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
            }
          }
        }
        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return;
        const inkCenter = (minX + maxX) / 2;
        const canvasCenter = canvas.width / 2;
        // Ink sits left of canvas center → positive offset shifts the element
        // right; the reverse when the ink overhangs the other way.
        setOffsetEm((canvasCenter - inkCenter) / fontSize);
      } catch {
        // Font/canvas unavailable — leave the correction at 0 (box centering).
      }
    };

    void measure();
    return () => {
      cancelled = true;
    };
  }, [fontFamily, sample, weight]);

  return offsetEm;
}

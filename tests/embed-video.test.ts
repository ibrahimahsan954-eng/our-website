import { describe, expect, test } from "bun:test";
import { getEmbedSrc, isDirectVideo } from "../src/lib/embed-video";

describe("getEmbedSrc", () => {
  test("parses youtu.be short links", () => {
    expect(getEmbedSrc("https://youtu.be/T7pNvhwRNBU?si=ogXx4LKdKcYi_YLx")).toBe(
      "https://www.youtube.com/embed/T7pNvhwRNBU?autoplay=1&rel=0&playsinline=1&color=white",
    );
  });

  test("parses youtube.com/watch?v= links", () => {
    expect(getEmbedSrc("https://www.youtube.com/watch?v=nLwa6VAWIKg")).toBe(
      "https://www.youtube.com/embed/nLwa6VAWIKg?autoplay=1&rel=0&playsinline=1&color=white",
    );
  });

  test("parses youtube.com/shorts/ links", () => {
    expect(getEmbedSrc("https://www.youtube.com/shorts/abc123DEF45")).toBe(
      "https://www.youtube.com/embed/abc123DEF45?autoplay=1&rel=0&playsinline=1&color=white",
    );
  });

  test("parses youtube.com/embed/ links", () => {
    expect(getEmbedSrc("https://www.youtube.com/embed/xM_Zuwe8gtQ")).toBe(
      "https://www.youtube.com/embed/xM_Zuwe8gtQ?autoplay=1&rel=0&playsinline=1&color=white",
    );
  });

  test("parses vimeo links", () => {
    expect(getEmbedSrc("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789?autoplay=1",
    );
    expect(getEmbedSrc("https://vimeo.com/video/987654321")).toBe(
      "https://player.vimeo.com/video/987654321?autoplay=1",
    );
  });

  test("returns direct video files unchanged", () => {
    expect(getEmbedSrc("https://cdn.example.com/reel.mp4")).toBe(
      "https://cdn.example.com/reel.mp4",
    );
    expect(getEmbedSrc("https://cdn.example.com/reel.mp4?token=abc")).toBe(
      "https://cdn.example.com/reel.mp4?token=abc",
    );
  });

  test("returns null for empty or unknown URLs", () => {
    expect(getEmbedSrc("")).toBeNull();
    expect(getEmbedSrc("https://example.com/not-a-video")).toBeNull();
  });
});

describe("isDirectVideo", () => {
  test("recognizes direct video file extensions", () => {
    expect(isDirectVideo("https://cdn.example.com/a.mp4")).toBe(true);
    expect(isDirectVideo("https://cdn.example.com/a.webm?x=1")).toBe(true);
    expect(isDirectVideo("https://cdn.example.com/a.ogg")).toBe(true);
    expect(isDirectVideo("https://cdn.example.com/a.mov")).toBe(true);
  });

  test("rejects streaming URLs", () => {
    expect(isDirectVideo("https://youtu.be/T7pNvhwRNBU")).toBe(false);
    expect(isDirectVideo("https://vimeo.com/123456789")).toBe(false);
  });
});

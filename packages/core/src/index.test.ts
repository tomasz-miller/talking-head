import { describe, expect, it } from "vitest";
import { charToViseme } from "./viseme-mapper.js";
import { textToVisemeTimeline } from "./text-to-timeline.js";
import { timedCharactersToVisemeTimeline } from "./timed-to-timeline.js";

describe("charToViseme", () => {
  it("maps vowels and consonant groups", () => {
    expect(charToViseme("a")).toBe("A");
    expect(charToViseme("e")).toBe("E");
    expect(charToViseme("o")).toBe("O");
    expect(charToViseme("u")).toBe("U");
    expect(charToViseme("b")).toBe("BMP");
    expect(charToViseme("f")).toBe("FV");
    expect(charToViseme("l")).toBe("L");
    expect(charToViseme(" ")).toBe("rest");
    expect(charToViseme(".")).toBe("rest");
  });

  it("uses next vowel for consonant lookahead", () => {
    expect(charToViseme("k", "a")).toBe("A");
  });

  it("maps Polish diacritics to visemes", () => {
    expect(charToViseme("ą")).toBe("A");
    expect(charToViseme("ę")).toBe("E");
    expect(charToViseme("ó")).toBe("O");
  });
});

describe("textToVisemeTimeline", () => {
  it("creates a non-empty timeline for text", () => {
    const timeline = textToVisemeTimeline("Hello!", { locale: "en-US" });

    expect(timeline.frames.length).toBeGreaterThan(0);
    expect(timeline.duration).toBeGreaterThan(0);
    expect(timeline.frames[0].start).toBe(0);
  });

  it("adds longer pause after punctuation", () => {
    const withPause = textToVisemeTimeline("Hi.", { charactersPerSecond: 14 });
    const withoutPause = textToVisemeTimeline("Hi", { charactersPerSecond: 14 });

    expect(withPause.duration).toBeGreaterThan(withoutPause.duration);
  });

  it("returns rest frame for empty text", () => {
    const timeline = textToVisemeTimeline("   ");

    expect(timeline.frames).toHaveLength(1);
    expect(timeline.frames[0].viseme).toBe("rest");
  });
});

describe("timedCharactersToVisemeTimeline", () => {
  it("uses provided timestamps", () => {
    const timeline = timedCharactersToVisemeTimeline([
      { text: "C", start: 0, end: 0.08 },
      { text: "z", start: 0.08, end: 0.16 },
      { text: "e", start: 0.16, end: 0.24 },
    ]);

    expect(timeline.frames[0].start).toBe(0);
    expect(timeline.frames.at(-1)?.end).toBe(timeline.duration);
    expect(timeline.duration).toBeGreaterThanOrEqual(0.24);
  });

  it("merges adjacent identical visemes", () => {
    const timeline = timedCharactersToVisemeTimeline([
      { text: "e", start: 0, end: 0.1 },
      { text: "e", start: 0.1, end: 0.2 },
    ]);

    expect(timeline.frames).toHaveLength(1);
    expect(timeline.frames[0].viseme).toBe("E");
  });

  it("respects source timestamps when longer than minimum frame duration", () => {
    const timeline = timedCharactersToVisemeTimeline([
      { text: "a", start: 0, end: 0.35 },
      { text: "b", start: 0.35, end: 0.8 },
    ]);

    expect(timeline.frames[0].end).toBeCloseTo(0.35, 2);
    expect(timeline.duration).toBeGreaterThanOrEqual(0.8);
  });
});

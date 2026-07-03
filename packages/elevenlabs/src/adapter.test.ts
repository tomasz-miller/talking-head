import { describe, expect, it } from "vitest";
import {
  extractTimedCharactersFromResponse,
  forcedAlignmentToTimedCharacters,
  mapElevenLabsFixture,
  mapElevenLabsTimestampResponse,
  normalizeCharacterAlignment,
  revokeAudioUrl,
  validateAudioBase64Length,
} from "./adapter.js";

describe("elevenlabs adapter", () => {
  it("maps timestamp response characters", () => {
    const characters = extractTimedCharactersFromResponse({
      alignment: {
        characters: [
          { text: "H", start: 0, end: 0.05 },
          { text: "i", start: 0.05, end: 0.1 },
        ],
      },
    });

    expect(characters).toEqual([
      { text: "H", start: 0, end: 0.05 },
      { text: "i", start: 0.05, end: 0.1 },
    ]);
  });

  it("maps forced alignment characters", () => {
    const characters = forcedAlignmentToTimedCharacters({
      characters: [{ text: "A", start: 0.1, end: 0.2 }],
      words: [{ text: "A", start: 0.1, end: 0.2 }],
    });

    expect(characters[0].text).toBe("A");
  });

  it("creates audio url from base64 payload", () => {
    const encoded = btoa("fake-audio");
    const result = mapElevenLabsTimestampResponse({
      audioBase64: encoded,
      alignment: {
        characters: [{ text: "A", start: 0, end: 0.1 }],
      },
    });

    expect(result?.audioUrl.startsWith("blob:")).toBe(true);
    expect(result?.characters).toHaveLength(1);

    if (result) {
      revokeAudioUrl(result.audioUrl);
    }
  });

  it("rejects oversized audio payloads", () => {
    expect(() => validateAudioBase64Length(100, 50)).toThrow(
      "Audio payload exceeds maximum allowed size.",
    );
  });

  it("normalizes raw API character alignment", () => {
    const characters = normalizeCharacterAlignment({
      characters: ["H", "i"],
      character_start_times_seconds: [0, 0.05],
      character_end_times_seconds: [0.05, 0.1],
    });

    expect(characters).toEqual([
      { text: "H", start: 0, end: 0.05 },
      { text: "i", start: 0.05, end: 0.1 },
    ]);
  });

  it("maps raw API timestamp response", () => {
    const encoded = btoa("fake-audio");
    const result = mapElevenLabsTimestampResponse({
      audio_base64: encoded,
      normalized_alignment: {
        characters: ["A"],
        character_start_times_seconds: [0],
        character_end_times_seconds: [0.1],
      },
    });

    expect(result?.audioUrl.startsWith("blob:")).toBe(true);
    expect(result?.characters).toEqual([{ text: "A", start: 0, end: 0.1 }]);

    if (result) {
      revokeAudioUrl(result.audioUrl);
    }
  });

  it("maps fixture audio url with alignment", () => {
    const result = mapElevenLabsFixture("/samples/demo.mp3", {
      characters: ["A"],
      character_start_times_seconds: [0],
      character_end_times_seconds: [0.1],
    });

    expect(result.audioUrl).toBe("/samples/demo.mp3");
    expect(result.characters).toEqual([{ text: "A", start: 0, end: 0.1 }]);
  });
});

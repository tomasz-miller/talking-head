import type { TimedCharacter, TimedWord } from "@talking-head/core";

export interface ElevenLabsCharacterTimestamp {
  text: string;
  start: number;
  end: number;
}

export interface ElevenLabsWordTimestamp {
  text: string;
  start: number;
  end: number;
}

/** Raw character alignment as returned by the ElevenLabs API. */
export interface ElevenLabsApiCharacterAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/** Raw word alignment as returned by the ElevenLabs API. */
export interface ElevenLabsApiWordAlignment {
  words: string[];
  word_start_times_seconds: number[];
  word_end_times_seconds: number[];
}

export type ElevenLabsAlignmentInput =
  | ElevenLabsApiCharacterAlignment
  | ElevenLabsApiWordAlignment
  | {
      characters?: ElevenLabsCharacterTimestamp[] | ElevenLabsApiCharacterAlignment;
      words?: ElevenLabsWordTimestamp[] | ElevenLabsApiWordAlignment;
    };

export interface ElevenLabsAlignment {
  characters?: ElevenLabsCharacterTimestamp[];
  words?: ElevenLabsWordTimestamp[];
}

export interface ElevenLabsTimestampResponse {
  audioBase64?: string;
  audio_base64?: string;
  alignment?: ElevenLabsAlignmentInput;
  normalizedAlignment?: ElevenLabsAlignmentInput;
  normalized_alignment?: ElevenLabsAlignmentInput;
}

export interface ElevenLabsForcedAlignmentResponse {
  characters: ElevenLabsCharacterTimestamp[];
  words: ElevenLabsWordTimestamp[];
}

const MAX_BASE64_AUDIO_LENGTH = 32 * 1024 * 1024;

function isApiCharacterAlignment(
  value: unknown,
): value is ElevenLabsApiCharacterAlignment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const alignment = value as ElevenLabsApiCharacterAlignment;
  return (
    Array.isArray(alignment.characters)
    && Array.isArray(alignment.character_start_times_seconds)
    && Array.isArray(alignment.character_end_times_seconds)
    && (alignment.characters.length === 0
      || typeof alignment.characters[0] === "string")
  );
}

function isApiWordAlignment(value: unknown): value is ElevenLabsApiWordAlignment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const alignment = value as ElevenLabsApiWordAlignment;
  return (
    Array.isArray(alignment.words)
    && Array.isArray(alignment.word_start_times_seconds)
    && Array.isArray(alignment.word_end_times_seconds)
    && (alignment.words.length === 0 || typeof alignment.words[0] === "string")
  );
}

function isNormalizedCharacterTimestamp(
  value: unknown,
): value is ElevenLabsCharacterTimestamp {
  return (
    typeof value === "object"
    && value !== null
    && "text" in value
    && "start" in value
    && "end" in value
  );
}

export function normalizeCharacterAlignment(
  alignment: ElevenLabsAlignmentInput | undefined,
): ElevenLabsCharacterTimestamp[] {
  if (!alignment) {
    return [];
  }

  if (isApiCharacterAlignment(alignment)) {
    return alignment.characters.map((text, index) => ({
      text,
      start: alignment.character_start_times_seconds[index] ?? 0,
      end: alignment.character_end_times_seconds[index] ?? 0,
    }));
  }

  if ("characters" in alignment && alignment.characters) {
    if (isApiCharacterAlignment(alignment.characters)) {
      return normalizeCharacterAlignment(alignment.characters);
    }

    if (
      Array.isArray(alignment.characters)
      && alignment.characters.every(isNormalizedCharacterTimestamp)
    ) {
      return alignment.characters;
    }
  }

  return [];
}

export function normalizeWordAlignment(
  alignment: ElevenLabsAlignmentInput | undefined,
): ElevenLabsWordTimestamp[] {
  if (!alignment) {
    return [];
  }

  if (isApiWordAlignment(alignment)) {
    return alignment.words.map((text, index) => ({
      text,
      start: alignment.word_start_times_seconds[index] ?? 0,
      end: alignment.word_end_times_seconds[index] ?? 0,
    }));
  }

  if ("words" in alignment && alignment.words) {
    if (isApiWordAlignment(alignment.words)) {
      return normalizeWordAlignment(alignment.words);
    }

    if (Array.isArray(alignment.words)) {
      return alignment.words;
    }
  }

  return [];
}

export function validateAudioBase64Length(
  length: number,
  maxLength = MAX_BASE64_AUDIO_LENGTH,
): void {
  if (length > maxLength) {
    throw new Error("Audio payload exceeds maximum allowed size.");
  }
}

export function elevenLabsCharactersToTimedCharacters(
  characters: ElevenLabsCharacterTimestamp[],
): TimedCharacter[] {
  return characters.map((entry) => ({
    text: entry.text,
    start: entry.start,
    end: entry.end,
  }));
}

export function elevenLabsWordsToTimedWords(words: ElevenLabsWordTimestamp[]): TimedWord[] {
  return words.map((entry) => ({
    text: entry.text,
    start: entry.start,
    end: entry.end,
  }));
}

function resolveAlignment(
  response: ElevenLabsTimestampResponse,
): ElevenLabsAlignmentInput | undefined {
  return (
    response.normalizedAlignment
    ?? response.normalized_alignment
    ?? response.alignment
  );
}

export function extractTimedCharactersFromResponse(
  response: ElevenLabsTimestampResponse,
): TimedCharacter[] {
  return elevenLabsCharactersToTimedCharacters(
    normalizeCharacterAlignment(resolveAlignment(response)),
  );
}

export function extractTimedWordsFromResponse(
  response: ElevenLabsTimestampResponse,
): TimedWord[] {
  return elevenLabsWordsToTimedWords(normalizeWordAlignment(resolveAlignment(response)));
}

export function forcedAlignmentToTimedCharacters(
  response: ElevenLabsForcedAlignmentResponse,
): TimedCharacter[] {
  return elevenLabsCharactersToTimedCharacters(response.characters);
}

export function forcedAlignmentToTimedWords(
  response: ElevenLabsForcedAlignmentResponse,
): TimedWord[] {
  return elevenLabsWordsToTimedWords(response.words);
}

export function revokeAudioUrl(audioUrl: string): void {
  if (audioUrl.startsWith("blob:")) {
    URL.revokeObjectURL(audioUrl);
  }
}

export function decodeBase64Audio(audioBase64: string, mimeType = "audio/mpeg"): string {
  validateAudioBase64Length(audioBase64.length);

  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export interface ElevenLabsTtsResult {
  audioUrl: string;
  characters: TimedCharacter[];
  words: TimedWord[];
}

export function resolveAudioBase64(response: ElevenLabsTimestampResponse): string | null {
  return response.audioBase64 ?? response.audio_base64 ?? null;
}

export function mapElevenLabsTimestampResponse(
  response: ElevenLabsTimestampResponse,
  mimeType = "audio/mpeg",
): ElevenLabsTtsResult | null {
  const audioBase64 = resolveAudioBase64(response);
  if (!audioBase64) {
    return null;
  }

  return {
    audioUrl: decodeBase64Audio(audioBase64, mimeType),
    characters: extractTimedCharactersFromResponse(response),
    words: extractTimedWordsFromResponse(response),
  };
}

export interface ElevenLabsFixtureResult {
  audioUrl: string;
  characters: TimedCharacter[];
  words: TimedWord[];
}

export function mapElevenLabsFixture(
  audioUrl: string,
  alignment: ElevenLabsAlignmentInput,
): ElevenLabsFixtureResult {
  return {
    audioUrl,
    characters: elevenLabsCharactersToTimedCharacters(normalizeCharacterAlignment(alignment)),
    words: elevenLabsWordsToTimedWords(normalizeWordAlignment(alignment)),
  };
}

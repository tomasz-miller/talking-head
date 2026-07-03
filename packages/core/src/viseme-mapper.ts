import type { Viseme } from "./types.js";
import { isConsonant, isPunctuation, isVowel, isWhitespace } from "./normalizer.js";

const BMP_CHARS = new Set(["b", "m", "p", "B", "M", "P"]);
const FV_CHARS = new Set(["f", "v", "w", "F", "V", "W"]);
const L_CHARS = new Set(["l", "L"]);
const A_CHARS = new Set(["a", "A", "ą", "Ą"]);
const E_CHARS = new Set(["e", "E", "ę", "Ę", "i", "I", "y", "Y"]);
const O_CHARS = new Set(["o", "O", "ó", "Ó"]);
const U_CHARS = new Set(["u", "U"]);

const CONSONANT_DEFAULT: Viseme = "E";

export function charToViseme(char: string, nextChar?: string): Viseme {
  if (isWhitespace(char) || isPunctuation(char)) {
    return "rest";
  }

  if (BMP_CHARS.has(char)) {
    return "BMP";
  }

  if (FV_CHARS.has(char)) {
    return "FV";
  }

  if (L_CHARS.has(char)) {
    return "L";
  }

  if (A_CHARS.has(char)) {
    return "A";
  }

  if (E_CHARS.has(char)) {
    return "E";
  }

  if (O_CHARS.has(char)) {
    return "O";
  }

  if (U_CHARS.has(char)) {
    return "U";
  }

  if (isConsonant(char)) {
    if (nextChar && isVowel(nextChar)) {
      return charToViseme(nextChar);
    }
    return CONSONANT_DEFAULT;
  }

  return "rest";
}

export function mergeAdjacentFrames<T extends { viseme: Viseme; start: number; end: number }>(
  frames: T[],
): T[] {
  if (frames.length === 0) {
    return [];
  }

  const merged: T[] = [frames[0]];

  for (let index = 1; index < frames.length; index += 1) {
    const current = frames[index];
    const previous = merged[merged.length - 1];

    if (previous.viseme === current.viseme) {
      previous.end = current.end;
      continue;
    }

    merged.push(current);
  }

  return merged;
}

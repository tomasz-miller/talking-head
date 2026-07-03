import { isPunctuation, normalizeText } from "./normalizer.js";
import { charToViseme, mergeAdjacentFrames } from "./viseme-mapper.js";
import type { TextTimelineOptions, VisemeFrame, VisemeTimeline } from "./types.js";

const DEFAULT_CHARACTERS_PER_SECOND = 9;
const DEFAULT_PAUSE_MS = 280;
const MIN_FRAME_MS = 110;
const MAX_FRAME_MS = 280;

export function textToVisemeTimeline(
  text: string,
  options: TextTimelineOptions = {},
): VisemeTimeline {
  const charactersPerSecond = options.charactersPerSecond ?? DEFAULT_CHARACTERS_PER_SECOND;
  const pauseAfterPunctuationMs = options.pauseAfterPunctuationMs ?? DEFAULT_PAUSE_MS;
  const normalized = normalizeText(text);

  if (!normalized) {
    return { frames: [{ viseme: "rest", start: 0, end: 0.2 }], duration: 0.2 };
  }

  const baseCharDuration = 1 / charactersPerSecond;
  const frames: VisemeFrame[] = [];
  let cursor = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const nextChar = normalized[index + 1];
    const viseme = charToViseme(char, nextChar);
    const duration = isPunctuation(char)
      ? pauseAfterPunctuationMs / 1000
      : Math.min(MAX_FRAME_MS / 1000, Math.max(MIN_FRAME_MS / 1000, baseCharDuration));

    frames.push({
      viseme,
      start: cursor,
      end: cursor + duration,
      character: char,
    });

    cursor += duration;
  }

  const merged = mergeAdjacentFrames(frames);
  const duration = merged.length > 0 ? merged[merged.length - 1].end : 0;

  return { frames: merged, duration };
}

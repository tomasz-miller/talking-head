import { charToViseme, mergeAdjacentFrames } from "./viseme-mapper.js";
import type { TimedCharacter, TimedTimelineOptions, VisemeFrame, VisemeTimeline } from "./types.js";

const DEFAULT_MIN_FRAME_MS = 80;

export function timedCharactersToVisemeTimeline(
  characters: TimedCharacter[],
  options: TimedTimelineOptions = {},
): VisemeTimeline {
  const minFrameDuration = (options.minFrameDurationMs ?? DEFAULT_MIN_FRAME_MS) / 1000;

  if (characters.length === 0) {
    return { frames: [{ viseme: "rest", start: 0, end: 0.2 }], duration: 0.2 };
  }

  const frames: VisemeFrame[] = characters.map((entry, index) => {
    const nextChar = characters[index + 1]?.text;
    const viseme = charToViseme(entry.text, nextChar);
    const sourceDuration = Math.max(0, entry.end - entry.start);
    const duration = Math.max(minFrameDuration, sourceDuration);

    return {
      viseme,
      start: entry.start,
      end: entry.start + duration,
      character: entry.text,
    };
  });

  const merged = mergeAdjacentFrames(frames);
  const duration = merged.length > 0 ? merged[merged.length - 1].end : 0;

  return { frames: merged, duration };
}

export function timedWordsToVisemeTimeline(
  words: { text: string; start: number; end: number }[],
  options: TimedTimelineOptions = {},
): VisemeTimeline {
  const characters: TimedCharacter[] = [];

  for (const word of words) {
    const chars = [...word.text];
    const wordDuration = Math.max(0.05, word.end - word.start);
    const charDuration = wordDuration / Math.max(chars.length, 1);

    chars.forEach((char, index) => {
      const start = word.start + index * charDuration;
      characters.push({
        text: char,
        start,
        end: start + charDuration,
      });
    });

    characters.push({
      text: " ",
      start: word.end,
      end: word.end + 0.05,
    });
  }

  return timedCharactersToVisemeTimeline(characters, options);
}

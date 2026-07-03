import { VisemeAnimator } from "./animator.js";
import { textToVisemeTimeline } from "./text-to-timeline.js";
import {
  timedCharactersToVisemeTimeline,
} from "./timed-to-timeline.js";
import type { TimelineSource } from "./types.js";

export * from "./types.js";
export * from "./normalizer.js";
export * from "./viseme-mapper.js";
export * from "./text-to-timeline.js";
export * from "./timed-to-timeline.js";
export * from "./animator.js";

export function createTimelineFromSource(source: TimelineSource) {
  switch (source.type) {
    case "text":
      return textToVisemeTimeline(source.text, source.options);
    case "timedCharacters":
      return timedCharactersToVisemeTimeline(source.characters, source.options);
    case "timeline":
      return source.timeline;
    default: {
      const exhaustive: never = source;
      return exhaustive;
    }
  }
}

export function createAnimator(): VisemeAnimator {
  return new VisemeAnimator();
}

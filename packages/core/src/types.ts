export type Viseme =
  | "rest"
  | "A"
  | "E"
  | "O"
  | "U"
  | "BMP"
  | "FV"
  | "L";

export interface VisemeFrame {
  viseme: Viseme;
  start: number;
  end: number;
  character?: string;
}

export interface VisemeTimeline {
  frames: VisemeFrame[];
  duration: number;
}

export interface TimedCharacter {
  text: string;
  start: number;
  end: number;
}

export interface TimedWord {
  text: string;
  start: number;
  end: number;
}

export interface TextTimelineOptions {
  locale?: string;
  charactersPerSecond?: number;
  pauseAfterPunctuationMs?: number;
}

export interface TimedTimelineOptions {
  locale?: string;
  minFrameDurationMs?: number;
}

export interface TalkingHeadOptions {
  locale?: string;
  speed?: number;
  charactersPerSecond?: number;
}

export interface AudioSyncOptions {
  audioElement?: HTMLAudioElement;
  getCurrentTime?: () => number;
}

export interface SetTimelineOptions {
  preservePosition?: boolean;
}

export type TimelineSource =
  | { type: "text"; text: string; options?: TextTimelineOptions }
  | { type: "timedCharacters"; characters: TimedCharacter[]; options?: TimedTimelineOptions }
  | { type: "timeline"; timeline: VisemeTimeline };

export interface AnimatorState {
  currentViseme: Viseme;
  elapsed: number;
  isPlaying: boolean;
}

export type AnimatorListener = (state: AnimatorState) => void;

import {
  createAnimator,
  textToVisemeTimeline,
  type SetTimelineOptions,
  type TextTimelineOptions,
  type Viseme,
  type VisemeTimeline,
} from "@talking-head/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseTalkingHeadOptions {
  locale?: string;
  speed?: number;
  charactersPerSecond?: number;
  audioElement?: HTMLAudioElement | null;
}

export interface UseTalkingHeadResult {
  viseme: Viseme;
  isPlaying: boolean;
  elapsed: number;
  timeline: VisemeTimeline | null;
  speak: (text: string, options?: TextTimelineOptions) => void;
  appendText: (chunk: string) => void;
  setTimeline: (timeline: VisemeTimeline, options?: SetTimelineOptions) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

export function useTalkingHead(options: UseTalkingHeadOptions = {}): UseTalkingHeadResult {
  const animatorRef = useRef(createAnimator());
  const queueRef = useRef("");
  const [viseme, setViseme] = useState<Viseme>("rest");
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timeline, setTimelineState] = useState<VisemeTimeline | null>(null);

  const textOptions = useMemo<TextTimelineOptions>(
    () => ({
      locale: options.locale ?? "en-US",
      charactersPerSecond: options.charactersPerSecond ?? 9,
    }),
    [options.charactersPerSecond, options.locale],
  );

  useEffect(() => {
    animatorRef.current.setSpeed(options.speed ?? 1);
  }, [options.speed]);

  useEffect(() => {
    animatorRef.current.setAudioSync(
      options.audioElement
        ? { audioElement: options.audioElement }
        : null,
    );
  }, [options.audioElement]);

  useEffect(() => {
    const unsubscribe = animatorRef.current.subscribe((state) => {
      setViseme(state.currentViseme);
      setIsPlaying(state.isPlaying);
      setElapsed(state.elapsed);
    });

    return unsubscribe;
  }, []);

  const setTimeline = useCallback((nextTimeline: VisemeTimeline, timelineOptions?: SetTimelineOptions) => {
    setTimelineState(nextTimeline);
    animatorRef.current.setTimeline(nextTimeline, timelineOptions);
  }, []);

  const speak = useCallback(
    (text: string, speakOptions?: TextTimelineOptions) => {
      queueRef.current = text;
      const nextTimeline = textToVisemeTimeline(text, {
        ...textOptions,
        ...speakOptions,
      });
      setTimeline(nextTimeline, { preservePosition: false });
      animatorRef.current.play();
    },
    [setTimeline, textOptions],
  );

  const appendText = useCallback(
    (chunk: string) => {
      if (!chunk) {
        return;
      }

      queueRef.current += chunk;
      const nextTimeline = textToVisemeTimeline(queueRef.current, textOptions);
      const preservePosition = animatorRef.current.getState().isPlaying
        || animatorRef.current.getState().elapsed > 0;

      setTimeline(nextTimeline, { preservePosition });

      if (!animatorRef.current.getState().isPlaying) {
        animatorRef.current.play();
      }
    },
    [setTimeline, textOptions],
  );

  const play = useCallback(() => {
    animatorRef.current.play();
  }, []);

  const pause = useCallback(() => {
    animatorRef.current.pause();
  }, []);

  const stop = useCallback(() => {
    queueRef.current = "";
    animatorRef.current.stop();
  }, []);

  return {
    viseme,
    isPlaying,
    elapsed,
    timeline,
    speak,
    appendText,
    setTimeline,
    play,
    pause,
    stop,
  };
}

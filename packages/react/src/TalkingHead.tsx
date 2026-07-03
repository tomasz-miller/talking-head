import type { VisemeTimeline } from "@talking-head/core";
import { useEffect, useRef } from "react";
import { BlondBlueEyedHead } from "./heads/BlondBlueEyedHead.js";
import { useTalkingHead } from "./useTalkingHead.js";

export interface TalkingHeadProps {
  text?: string;
  timeline?: VisemeTimeline;
  speaking?: boolean;
  /** When true, text prop is treated as incremental LLM output. */
  streaming?: boolean;
  speed?: number;
  locale?: string;
  charactersPerSecond?: number;
  skinTone?: "light";
  hairColor?: "blond";
  eyeColor?: "blue";
  audioElement?: HTMLAudioElement | null;
  className?: string;
  width?: number;
  height?: number;
  onVisemeChange?: (viseme: string) => void;
}

export function TalkingHead({
  text,
  timeline,
  speaking = false,
  streaming = false,
  speed = 1,
  locale = "en-US",
  charactersPerSecond = 9,
  audioElement = null,
  className,
  width,
  height,
  onVisemeChange,
}: TalkingHeadProps) {
  const previousTextRef = useRef("");
  const {
    viseme,
    speak,
    appendText,
    setTimeline,
    play,
    pause,
    stop,
  } = useTalkingHead({
    locale,
    speed,
    charactersPerSecond,
    audioElement,
  });

  useEffect(() => {
    if (timeline) {
      setTimeline(timeline, { preservePosition: streaming && speaking });
      return;
    }

    if (!text) {
      previousTextRef.current = "";
      return;
    }

    if (streaming) {
      const delta = text.startsWith(previousTextRef.current)
        ? text.slice(previousTextRef.current.length)
        : text;

      if (delta) {
        if (!text.startsWith(previousTextRef.current)) {
          stop();
        }
        appendText(delta);
      }

      previousTextRef.current = text;
      return;
    }

    previousTextRef.current = text;
    speak(text);
  }, [appendText, setTimeline, speak, stop, streaming, text, timeline]);

  useEffect(() => {
    if (speaking) {
      if (timeline || text) {
        play();
      }
      return;
    }

    pause();
  }, [pause, play, speaking, text, timeline]);

  useEffect(() => {
    onVisemeChange?.(viseme);
  }, [onVisemeChange, viseme]);

  useEffect(
    () => () => {
      stop();
      previousTextRef.current = "";
    },
    [stop],
  );

  return (
    <BlondBlueEyedHead
      viseme={viseme}
      className={className}
      width={width}
      height={height}
    />
  );
}

export { useTalkingHead, BlondBlueEyedHead };

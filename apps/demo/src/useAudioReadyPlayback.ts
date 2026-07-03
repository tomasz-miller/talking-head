import {
  timedCharactersToVisemeTimeline,
  type SetTimelineOptions,
  type VisemeTimeline,
} from "@talking-head/core";
import {
  mapElevenLabsFixture,
  mapElevenLabsTimestampResponse,
  revokeAudioUrl,
} from "@talking-head/elevenlabs";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchElevenLabsWithTimestamps, getElevenLabsConfigFromEnv } from "./elevenlabs-client.js";
import {
  EN_DEMO_ALIGNMENT,
  EN_DEMO_AUDIO_URL,
  EN_DEMO_TRANSCRIPT,
} from "./fixtures/en-demo.js";

export type AudioSource = "sample" | "elevenlabs-live";

export interface UseAudioReadyPlaybackOptions {
  audioElement: HTMLAudioElement | null;
  setTimeline: (timeline: VisemeTimeline, options?: SetTimelineOptions) => void;
  play: () => void;
  stop: () => void;
}

export interface UseAudioReadyPlaybackResult {
  hasLiveApi: boolean;
  fixtureTranscript: string;
  audioSource: AudioSource | null;
  audioTimeline: VisemeTimeline | null;
  loading: boolean;
  error: string | null;
  startPlayback: (text: string) => Promise<void>;
  clearError: () => void;
}

interface PreparedPlayback {
  audioUrl: string;
  timeline: VisemeTimeline;
  source: AudioSource;
  revokeOnCleanup: boolean;
}

export function useAudioReadyPlayback(
  options: UseAudioReadyPlaybackOptions,
): UseAudioReadyPlaybackResult {
  const { audioElement, setTimeline, play, stop } = options;
  const elevenLabsConfig = getElevenLabsConfigFromEnv();
  const hasLiveApi = elevenLabsConfig !== null;

  const managedAudioUrlRef = useRef<string | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [audioTimeline, setAudioTimeline] = useState<VisemeTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeManagedAudioUrl = useCallback(() => {
    if (managedAudioUrlRef.current) {
      revokeAudioUrl(managedAudioUrlRef.current);
      managedAudioUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeManagedAudioUrl, [revokeManagedAudioUrl]);

  useEffect(() => {
    if (!audioElement) {
      return;
    }

    const handleEnded = () => {
      stop();
    };

    audioElement.addEventListener("ended", handleEnded);
    return () => audioElement.removeEventListener("ended", handleEnded);
  }, [audioElement, stop]);

  const preparePlayback = useCallback(
    async (text: string): Promise<PreparedPlayback | null> => {
      if (elevenLabsConfig) {
        const response = await fetchElevenLabsWithTimestamps(text, elevenLabsConfig);
        const mapped = mapElevenLabsTimestampResponse(response);

        if (!mapped) {
          throw new Error("ElevenLabs response did not include audio data.");
        }

        return {
          audioUrl: mapped.audioUrl,
          timeline: timedCharactersToVisemeTimeline(mapped.characters),
          source: "elevenlabs-live",
          revokeOnCleanup: true,
        };
      }

      const fixture = mapElevenLabsFixture(EN_DEMO_AUDIO_URL, EN_DEMO_ALIGNMENT);
      return {
        audioUrl: fixture.audioUrl,
        timeline: timedCharactersToVisemeTimeline(fixture.characters),
        source: "sample",
        revokeOnCleanup: false,
      };
    },
    [elevenLabsConfig],
  );

  const startPlayback = useCallback(
    async (text: string) => {
      if (!audioElement) {
        return;
      }

      setLoading(true);
      setError(null);
      stop();
      revokeManagedAudioUrl();

      try {
        const prepared = await preparePlayback(text);
        if (!prepared) {
          return;
        }

        if (prepared.revokeOnCleanup) {
          managedAudioUrlRef.current = prepared.audioUrl;
        }

        setAudioSource(prepared.source);
        setAudioTimeline(prepared.timeline);
        setTimeline(prepared.timeline, { preservePosition: false });

        audioElement.src = prepared.audioUrl;
        audioElement.currentTime = 0;

        try {
          await audioElement.play();
        } catch {
          // Autoplay may be blocked; the animator still drives the mouth via
          // its own clock below, and playback resumes once the user interacts.
        }

        // The animator's own play() must run regardless of native audio autoplay
        // outcome: it starts the rAF loop that drives viseme updates, and lets
        // the animator switch to the audio element's currentTime as its clock.
        play();
      } catch (playbackError) {
        const message =
          playbackError instanceof Error
            ? playbackError.message
            : "Failed to prepare audio playback.";
        setError(message);
        setAudioSource(null);
        setAudioTimeline(null);
      } finally {
        setLoading(false);
      }
    },
    [audioElement, play, preparePlayback, revokeManagedAudioUrl, setTimeline, stop],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    hasLiveApi,
    fixtureTranscript: EN_DEMO_TRANSCRIPT,
    audioSource,
    audioTimeline,
    loading,
    error,
    startPlayback,
    clearError,
  };
}

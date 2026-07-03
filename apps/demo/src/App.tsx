import { BlondBlueEyedHead, useTalkingHead } from "@talking-head/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAudioReadyPlayback } from "./useAudioReadyPlayback.js";

const DEFAULT_TEXT =
  "Hi! I'm your avatar. I can speak from LLM text or sync lips to audio.";

type DemoMode = "text" | "stream" | "audio";

function splitTextIntoStreamChunks(value: string): string[] {
  return value.match(/\S+\s*/g) ?? [];
}

export function App() {
  const [mode, setMode] = useState<DemoMode>("text");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [speaking, setSpeaking] = useState(false);
  const [streamIndex, setStreamIndex] = useState(0);
  const [streamChunks, setStreamChunks] = useState<string[]>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const {
    viseme,
    elapsed,
    isPlaying,
    speak,
    appendText,
    setTimeline,
    play,
    pause,
    stop,
  } = useTalkingHead({
    locale: "en-US",
    speed: 1,
    charactersPerSecond: 9,
    audioElement: mode === "audio" ? audioElement : null,
  });

  const {
    hasLiveApi,
    fixtureTranscript,
    audioSource,
    audioTimeline,
    loading: audioLoading,
    error: audioError,
    startPlayback,
    clearError,
  } = useAudioReadyPlayback({
    audioElement,
    setTimeline,
    play,
    stop,
  });

  const status = useMemo(() => {
    return `Viseme: ${viseme} | elapsed: ${elapsed.toFixed(2)}s | ${isPlaying ? "playing" : "idle"}`;
  }, [elapsed, isPlaying, viseme]);

  const resetMode = useCallback(
    (nextMode: DemoMode) => {
      setMode(nextMode);
      setSpeaking(false);
      setStreamIndex(0);
      setStreamChunks([]);
      clearError();
      stop();

      if (nextMode === "audio" && !hasLiveApi) {
        setText(fixtureTranscript);
      }
    },
    [clearError, fixtureTranscript, hasLiveApi, stop],
  );

  const handleSpeak = useCallback(async () => {
    stop();
    setSpeaking(true);

    if (mode === "audio") {
      await startPlayback(text);
      return;
    }

    speak(text);
  }, [mode, speak, startPlayback, stop, text]);

  const handleStream = useCallback(() => {
    stop();
    setStreamChunks(splitTextIntoStreamChunks(text));
    setStreamIndex(0);
    setSpeaking(true);
  }, [stop, text]);

  useEffect(() => {
    if (mode !== "stream" || !speaking) {
      return;
    }

    if (streamIndex >= streamChunks.length) {
      return;
    }

    const timeout = window.setTimeout(() => {
      appendText(streamChunks[streamIndex]);
      setStreamIndex((value) => value + 1);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [appendText, mode, speaking, streamChunks, streamIndex]);

  const isAudioTextReadonly = mode === "audio" && !hasLiveApi;

  return (
    <main className="app">
      <header className="header">
        <h1>Talking Head</h1>
        <p>SVG avatar with lip animation driven by text or audio timestamps.</p>
      </header>

      <section className="layout">
        <div className="panel avatar-panel">
          <BlondBlueEyedHead viseme={viseme} width={280} height={336} />
          <p className="status">{status}</p>
          {mode === "audio" && audioSource ? (
            <span className={`source-badge source-badge--${audioSource}`}>
              {audioSource === "elevenlabs-live" ? "ElevenLabs live" : "Sample audio"}
            </span>
          ) : null}
          <audio
            ref={setAudioElement}
            controls={mode === "audio"}
            hidden={mode !== "audio"}
          />
        </div>

        <div className="panel">
          <div className="mode-switch">
            <button
              type="button"
              className={mode === "text" ? "active" : ""}
              onClick={() => resetMode("text")}
            >
              Text
            </button>
            <button
              type="button"
              className={mode === "stream" ? "active" : ""}
              onClick={() => resetMode("stream")}
            >
              Streaming
            </button>
            <button
              type="button"
              className={mode === "audio" ? "active" : ""}
              onClick={() => resetMode("audio")}
            >
              Audio-ready
            </button>
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            readOnly={isAudioTextReadonly}
            aria-label="Animation text"
          />

          <div className="controls">
            <button
              type="button"
              onClick={handleSpeak}
              disabled={mode === "stream" || (mode === "audio" && audioLoading)}
            >
              {mode === "audio" && audioLoading ? "Loading..." : "Speak"}
            </button>
            <button type="button" className="secondary" onClick={handleStream} disabled={mode !== "stream"}>
              Simulate streaming
            </button>
            <button type="button" className="secondary" onClick={() => pause()}>
              Pause
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setSpeaking(false);
                stop();
              }}
            >
              Stop
            </button>
          </div>

          {audioError ? <p className="error">{audioError}</p> : null}

          <p className="hint">
            <strong>Audio-ready</strong> syncs lip animation to real audio using character
            timestamps (ElevenLabs-compatible format). This is not another browser TTS path: the
            mouth follows
            {" "}
            <code>HTMLAudioElement.currentTime</code>
            {" "}
            and a precomputed viseme timeline.
            {hasLiveApi
              ? " With VITE_ELEVENLABS_API_KEY set, Speak generates fresh audio for the text above."
              : " Offline demo uses the bundled sample audio and matching transcript."}
            {audioTimeline ? ` Timeline: ${audioTimeline.frames.length} frames.` : ""}
          </p>
        </div>
      </section>
    </main>
  );
}

import type { ElevenLabsTimestampResponse } from "@talking-head/elevenlabs";

/** ElevenLabs slows speech down to this value at minimum before quality degrades noticeably. */
const MIN_SPEED = 0.7;
/** ElevenLabs speeds speech up to this value at maximum before quality degrades noticeably. */
const MAX_SPEED = 1.2;

export interface ElevenLabsClientOptions {
  apiKey: string;
  voiceId: string;
  /** Speech rate multiplier passed as `voice_settings.speed` (1.0 = normal, clamped to [0.7, 1.2]). */
  speed?: number;
}

export async function fetchElevenLabsWithTimestamps(
  text: string,
  options: ElevenLabsClientOptions,
): Promise<ElevenLabsTimestampResponse> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${options.voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": options.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings:
          options.speed !== undefined
            ? { speed: Math.min(MAX_SPEED, Math.max(MIN_SPEED, options.speed)) }
            : undefined,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<ElevenLabsTimestampResponse>;
}

const DEFAULT_SPEED = 0.85;

export function getElevenLabsConfigFromEnv(): ElevenLabsClientOptions | null {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    return null;
  }

  const configuredSpeed = Number(import.meta.env.VITE_ELEVENLABS_SPEED);

  return {
    apiKey,
    voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM",
    speed: Number.isFinite(configuredSpeed) ? configuredSpeed : DEFAULT_SPEED,
  };
}

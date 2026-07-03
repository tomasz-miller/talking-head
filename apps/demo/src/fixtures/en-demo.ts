import type { ElevenLabsApiCharacterAlignment } from "@talking-head/elevenlabs";
import alignment from "./en-demo.alignment.json";

export const EN_DEMO_TRANSCRIPT =
  "Hi! I'm your avatar. I can speak from LLM text or sync lips to audio.";

export const EN_DEMO_AUDIO_URL = "/samples/en-demo.mp3";

export const EN_DEMO_ALIGNMENT = alignment as ElevenLabsApiCharacterAlignment;

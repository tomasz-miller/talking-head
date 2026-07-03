/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ELEVENLABS_API_KEY?: string;
  readonly VITE_ELEVENLABS_VOICE_ID?: string;
  readonly VITE_ELEVENLABS_SPEED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

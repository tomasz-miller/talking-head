# Talking Head

TypeScript/React library for animated SVG avatars with lip sync driven by text or audio timestamps (e.g. ElevenLabs).

## Packages

- `@talking-head/core` – maps text/timestamps to visemes and runs the animator
- `@talking-head/react` – `TalkingHead` component and `useTalkingHead` hook
- `@talking-head/elevenlabs` – adapter for TTS responses with timestamps
- `@talking-head/demo` – demo application

## Quick start

```bash
pnpm install
pnpm build
pnpm dev
```

The demo runs at `http://localhost:5173`.

## Usage (React)

```tsx
import { TalkingHead } from "@talking-head/react";

<TalkingHead
  text={answerFromLlm}
  speaking={true}
  streaming={true}
  locale="en-US"
/>
```

The `streaming` prop treats changes to `text` as appended tokens (without restarting the animation from the beginning).

## Core API

```ts
import { textToVisemeTimeline, timedCharactersToVisemeTimeline } from "@talking-head/core";

const timeline = textToVisemeTimeline("Hello!", { locale: "en-US" });
```

## ElevenLabs integration

```ts
import { mapElevenLabsTimestampResponse } from "@talking-head/elevenlabs";
import { timedCharactersToVisemeTimeline } from "@talking-head/core";

const result = mapElevenLabsTimestampResponse(elevenLabsResponse);
const timeline = timedCharactersToVisemeTimeline(result.characters);
```

Then play `result.audioUrl` and sync the animation with `HTMLAudioElement.currentTime`. When finished, call `revokeAudioUrl(result.audioUrl)`.

The adapter accepts both the raw ElevenLabs API shape (`audio_base64`, parallel `character_*_times_seconds` arrays) and a normalized `{ text, start, end }` format.

## Audio-ready demo

In the demo app, switch to **Audio-ready** to see lip sync driven by real audio and character timestamps instead of estimated text pacing.

**Offline (default):** uses the bundled sample at `apps/demo/public/samples/en-demo.mp3` with matching alignment in `apps/demo/src/fixtures/en-demo.alignment.json`. The textarea is read-only in this mode because the transcript must match the recording.

**Live ElevenLabs:** copy `apps/demo/.env.example` to `apps/demo/.env` and set `VITE_ELEVENLABS_API_KEY`. Speak then generates fresh audio for the text in the textarea.

**Regenerate fixtures** (maintainers, requires `ELEVENLABS_API_KEY`):

```bash
ELEVENLABS_API_KEY=your_key pnpm generate:demo-audio
```

This calls ElevenLabs `with-timestamps` and overwrites the sample MP3 and alignment JSON.

## Architecture

- Text fallback: estimated timeline based on reading pace
- Audio-ready: timeline from character/word timestamps from a TTS provider
- SVG head: viseme layers switched by the animator

## Locale support

Pass the `locale` prop (e.g. `"en-US"`, `"pl-PL"`) to configure language-specific behavior. Polish diacritics (`ą`, `ę`, `ó`, etc.) are mapped to visemes in core, so Polish text input works out of the box.

#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DEMO_TEXT =
  "Hi! I'm your avatar. I can speak from LLM text or sync lips to audio.";

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

const outputDir = path.join(rootDir, "apps/demo/public/samples");
const fixtureDir = path.join(rootDir, "apps/demo/src/fixtures");
const audioPath = path.join(outputDir, "en-demo.mp3");
const alignmentPath = path.join(fixtureDir, "en-demo.alignment.json");

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: DEMO_TEXT,
      model_id: "eleven_multilingual_v2",
    }),
  },
);

if (!response.ok) {
  const body = await response.text();
  console.error(`ElevenLabs API error (${response.status}): ${body}`);
  process.exit(1);
}

const payload = await response.json();

if (!payload.audio_base64) {
  console.error("ElevenLabs response did not include audio_base64.");
  process.exit(1);
}

const alignment = payload.normalized_alignment ?? payload.alignment;

if (!alignment) {
  console.error("ElevenLabs response did not include alignment data.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });
await mkdir(fixtureDir, { recursive: true });

const audioBytes = Buffer.from(payload.audio_base64, "base64");
await writeFile(audioPath, audioBytes);
await writeFile(alignmentPath, `${JSON.stringify(alignment, null, 2)}\n`);

console.log(`Wrote ${audioPath}`);
console.log(`Wrote ${alignmentPath}`);
console.log(`Transcript: ${DEMO_TEXT}`);

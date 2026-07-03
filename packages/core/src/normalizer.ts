const PUNCTUATION_PAUSE_CHARS = new Set([",", ".", "!", "?", ";", ":", "…"]);

export function normalizeText(text: string): string {
  return text.normalize("NFC").trim();
}

export function isPunctuation(char: string): boolean {
  return PUNCTUATION_PAUSE_CHARS.has(char);
}

export function isWhitespace(char: string): boolean {
  return /\s/.test(char);
}

export function isVowel(char: string): boolean {
  return /[aeiouyąęóAEIOUYĄĘÓ]/u.test(char);
}

export function isConsonant(char: string): boolean {
  return /[a-ząćęłńóśźż]/iu.test(char) && !isVowel(char);
}

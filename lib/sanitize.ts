/**
 * Sanitizers for unpaired UTF-16 surrogate code units.
 *
 * LinkedIn post text frequently contains emoji that arrive truncated or
 * double-encoded from the workflow. A lone high surrogate (e.g. \uD83D with
 * no following low surrogate) survives JSON.stringify as an unpaired \udXXX
 * escape, which strict JSON parsers reject with errors like:
 * "The request body is not valid JSON: no low surrogate in string".
 *
 * These helpers remove unpaired surrogates both as raw characters in JS
 * strings and as literal escape sequences inside already-serialized JSON
 * text, so every payload we send or store is well-formed.
 */

const SURROGATE_CHAR_RE = /[\uD800-\uDFFF]/;

/** Removes unpaired UTF-16 surrogate code units from a string. */
export function stripLoneSurrogates(text: string): string {
  if (!SURROGATE_CHAR_RE.test(text)) return text;
  let result = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = i + 1 < text.length ? text.charCodeAt(i + 1) : -1;
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += text[i];
        result += text[i + 1];
        i += 1;
      }
      // Lone high surrogate: dropped.
    } else if (!(code >= 0xdc00 && code <= 0xdfff)) {
      result += text[i];
    }
    // Lone low surrogate: dropped.
  }
  return result;
}

const BACKSLASH_PAIR_PLACEHOLDER = '\u0001';

/**
 * Removes unpaired surrogate escape sequences (e.g. a literal "\\uD83D" not
 * followed by a low-surrogate escape) from serialized JSON text while keeping
 * valid surrogate-pair escapes intact. Escaped backslashes are protected so
 * literal "\\\\uD83D" text content is left untouched.
 */
export function stripUnpairedSurrogateEscapes(text: string): string {
  if (!text.includes('\\u')) return text;
  const protectedText = text.split('\\\\').join(BACKSLASH_PAIR_PLACEHOLDER);
  const cleaned = protectedText.replace(
    /\\u[dD][89abAB][0-9a-fA-F]{2}(?:\\u[dD][c-fC-F][0-9a-fA-F]{2})?|\\u[dD][c-fC-F][0-9a-fA-F]{2}/g,
    (match) => (match.length === 12 ? match : '')
  );
  return cleaned.split(BACKSLASH_PAIR_PLACEHOLDER).join('\\\\');
}

/** Deep-cleans every string (keys and values) in an arbitrary value. */
export function sanitizeDeep(value: unknown): unknown {
  if (typeof value === 'string') return stripLoneSurrogates(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeDeep(item));
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[stripLoneSurrogates(key)] = sanitizeDeep(inner);
    }
    return out;
  }
  return value;
}

/**
 * JSON.stringify that is guaranteed to produce text without unpaired
 * surrogates — safe to send to strict JSON APIs.
 */
export function safeJsonStringify(value: unknown): string {
  const json = JSON.stringify(sanitizeDeep(value));
  return stripUnpairedSurrogateEscapes(json ?? 'null');
}

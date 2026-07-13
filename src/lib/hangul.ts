const SYLLABLE_BASE = 0xac00;
const SYLLABLE_END = 0xd7a3;
const JUNGSUNG_COUNT = 21;
const JONGSUNG_COUNT = 28;

// 19 initial consonants, in the order Hangul syllable composition uses.
const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

const CHOSUNG_SET = new Set<string>(CHOSUNG);

function chosungOf(char: string): string | null {
  const code = char.codePointAt(0);
  if (code === undefined || code < SYLLABLE_BASE || code > SYLLABLE_END) return null;
  const index = Math.floor(((code - SYLLABLE_BASE) / JUNGSUNG_COUNT / JONGSUNG_COUNT));
  return CHOSUNG[index] ?? null;
}

/**
 * True if `candidate` starts with `query`, where a bare consonant jamo in
 * `query` (e.g. "ㅁ") matches any syllable whose initial consonant is that
 * jamo (마/머/모/무/...), and a full syllable in `query` requires an exact
 * character match. Falls back to a plain case-insensitive prefix check for
 * non-Hangul input (numbers, English item codes, etc.).
 */
export function chosungPrefixMatch(candidate: string, query: string): boolean {
  if (!query) return true;
  const c = candidate;
  const q = query;
  if (q.length > c.length) return false;

  for (let i = 0; i < q.length; i++) {
    const qc = q[i];
    const cc = c[i];
    if (CHOSUNG_SET.has(qc)) {
      if (chosungOf(cc) !== qc) return false;
    } else if (qc.toLowerCase() !== cc.toLowerCase()) {
      return false;
    }
  }
  return true;
}

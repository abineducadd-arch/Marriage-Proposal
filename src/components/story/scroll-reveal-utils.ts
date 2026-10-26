export interface TextToken {
  id: number;
  wordIndex: number; // 0..N-1 for words, -1 for whitespace/newlines
  text: string;
  isWord: boolean;
  isNewline: boolean;
}

/**
 * Parses raw text into words and whitespace/newlines while preserving
 * all punctuation, emojis, spaces, and formatting exactly.
 */
export function parseTokens(text: string): { tokens: TextToken[]; totalWords: number } {
  const parts = text.split(/(\r\n|\n|\s+)/);
  const tokens: TextToken[] = [];
  let wordCount = 0;
  let id = 0;

  for (const part of parts) {
    if (!part) continue;
    if (part === "\n" || part === "\r\n") {
      tokens.push({
        id: id++,
        wordIndex: -1,
        text: part,
        isWord: false,
        isNewline: true,
      });
    } else if (/^\s+$/.test(part)) {
      tokens.push({
        id: id++,
        wordIndex: -1,
        text: part,
        isWord: false,
        isNewline: false,
      });
    } else {
      tokens.push({
        id: id++,
        wordIndex: wordCount++,
        text: part,
        isWord: true,
        isNewline: false,
      });
    }
  }

  return { tokens, totalWords: wordCount };
}

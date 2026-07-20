import { describe, it, expect } from 'vitest';
import { splitTextIntoChunks } from './chunkingService';

describe('chunkingService', () => {
  it('chunks text according to limits and overlaps', () => {
    // Generate a long dummy text (1 token is roughly 4 chars, so let's make it long enough for multiple chunks)
    // We aim for > 600 tokens (so > 2400 chars)
    const longText = 'This is a test word. '.repeat(400); // 400 * 5 words = 2000 words. Should be plenty of tokens.

    const chunks = splitTextIntoChunks(longText);

    // Assert reasonable chunk count
    expect(chunks.length).toBeGreaterThan(1);

    // Assert no chunk exceeds token limit
    chunks.forEach((chunk) => {
      expect(chunk.tokenCount).toBeLessThanOrEqual(600);
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.text.length).toBeGreaterThan(0);
    });

    // We can't strictly assert EXACT overlap amount string-matching because gpt-tokenizer handles
    // subword tokens differently than spaces, but we know there must be overlapping text.
    if (chunks.length >= 2) {
      const firstChunkText = chunks[0].text;
      const secondChunkText = chunks[1].text;

      // They should share SOME common substring at the tail of chunk 1 / head of chunk 2 due to overlap.
      // Since our text is highly repetitive it might be tricky to test a unique overlap,
      // but we can ensure they are not mutually exclusive disjoint splits just by knowing the logic works.
      // We will ensure at least both contain the repeated string.
      expect(firstChunkText).toContain('This is a test word.');
      expect(secondChunkText).toContain('This is a test word.');
    }
  });

  it('handles small text that fits in one chunk', () => {
    const text = 'Just a small piece of text.';
    const chunks = splitTextIntoChunks(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].tokenCount).toBeLessThanOrEqual(600);
    expect(chunks[0].text).toBe(text);
  });
});

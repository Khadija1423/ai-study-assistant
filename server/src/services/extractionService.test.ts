import { describe, it, expect } from 'vitest';
import { extractTextFromFile } from './extractionService';

describe('extractionService', () => {
  it('extracts text from a dummy txt file buffer', async () => {
    const buffer = Buffer.from('Hello world this is a test.');
    const result = await extractTextFromFile(buffer, 'text/plain');
    expect(result).toBe('Hello world this is a test.');
  });

  it('throws an error for unsupported files', async () => {
    const buffer = Buffer.from('fake data');
    await expect(extractTextFromFile(buffer, 'image/png')).rejects.toThrow('Unsupported file type');
  });
});

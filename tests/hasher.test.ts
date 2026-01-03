import { describe, it, expect } from 'vitest';
import { calculateHash, hashInlineElements } from '../src/hasher';
import type { InlineElement } from '../src/types';

describe('hasher', () => {
  describe('calculateHash', () => {
    it('calculates SHA-256 hash for content', () => {
      const content = 'console.log("hello")';

      const hash = calculateHash(content);

      expect(hash).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/);
    });

    it('returns consistent hash for same content', () => {
      const content = 'const x = 1;';

      const hash1 = calculateHash(content);
      const hash2 = calculateHash(content);

      expect(hash1).toBe(hash2);
    });

    it('returns different hash for different content', () => {
      const hash1 = calculateHash('const a = 1;');
      const hash2 = calculateHash('const b = 2;');

      expect(hash1).not.toBe(hash2);
    });

    it('handles empty content', () => {
      const hash = calculateHash('');

      expect(hash).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/);
    });

    it('handles multi-line content', () => {
      const content = `
        function foo() {
          return 'bar';
        }
      `;

      const hash = calculateHash(content);

      expect(hash).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/);
    });

    it('handles special characters', () => {
      const content = '<script>alert("xss")</script>';

      const hash = calculateHash(content);

      expect(hash).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('hashInlineElements', () => {
    it('hashes array of inline elements', () => {
      const elements: InlineElement[] = [
        { content: 'const a = 1;', startIndex: 0, endIndex: 20 },
        { content: 'const b = 2;', startIndex: 30, endIndex: 50 }
      ];

      const result = hashInlineElements(elements, 'script');

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('script');
      expect(result[1].type).toBe('script');
    });

    it('returns hash results with content and type', () => {
      const elements: InlineElement[] = [
        { content: 'body { color: red; }', startIndex: 0, endIndex: 30 }
      ];

      const result = hashInlineElements(elements, 'style');

      expect(result[0]).toHaveProperty('hash');
      expect(result[0]).toHaveProperty('content');
      expect(result[0]).toHaveProperty('type');
      expect(result[0].content).toBe('body { color: red; }');
      expect(result[0].type).toBe('style');
    });

    it('returns empty array for empty input', () => {
      const result = hashInlineElements([], 'script');

      expect(result).toHaveLength(0);
    });

    it('preserves original content in result', () => {
      const content = 'console.log("test")';
      const elements: InlineElement[] = [
        { content, startIndex: 0, endIndex: 30 }
      ];

      const result = hashInlineElements(elements, 'script');

      expect(result[0].content).toBe(content);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { injectIntegrity, processHtml } from '../src/injector';
import type { HashResult } from '../src/types';

describe('injector', () => {
  describe('injectIntegrity', () => {
    it('adds integrity attribute to inline script', () => {
      const html = '<script>console.log("hello")</script>';
      const hashes: HashResult[] = [
        { hash: 'sha256-abc123', content: 'console.log("hello")', type: 'script' }
      ];

      const result = injectIntegrity(html, hashes);

      expect(result).toContain('integrity="sha256-abc123"');
    });

    it('adds integrity attribute to inline style', () => {
      const html = '<style>body { color: red; }</style>';
      const hashes: HashResult[] = [
        { hash: 'sha256-xyz789', content: 'body { color: red; }', type: 'style' }
      ];

      const result = injectIntegrity(html, hashes);

      expect(result).toContain('integrity="sha256-xyz789"');
    });

    it('handles multiple scripts', () => {
      const html = '<script>const a = 1;</script><script>const b = 2;</script>';
      const hashes: HashResult[] = [
        { hash: 'sha256-hash1', content: 'const a = 1;', type: 'script' },
        { hash: 'sha256-hash2', content: 'const b = 2;', type: 'script' }
      ];

      const result = injectIntegrity(html, hashes);

      expect(result).toContain('integrity="sha256-hash1"');
      expect(result).toContain('integrity="sha256-hash2"');
    });

    it('handles mixed scripts and styles', () => {
      const html = '<script>code</script><style>css</style>';
      const hashes: HashResult[] = [
        { hash: 'sha256-script-hash', content: 'code', type: 'script' },
        { hash: 'sha256-style-hash', content: 'css', type: 'style' }
      ];

      const result = injectIntegrity(html, hashes);

      expect(result).toContain('integrity="sha256-script-hash"');
      expect(result).toContain('integrity="sha256-style-hash"');
    });

    it('preserves existing attributes', () => {
      const html = '<script type="module">code</script>';
      const hashes: HashResult[] = [
        { hash: 'sha256-hash', content: 'code', type: 'script' }
      ];

      const result = injectIntegrity(html, hashes);

      expect(result).toContain('type="module"');
      expect(result).toContain('integrity="sha256-hash"');
    });

    it('does not add integrity to scripts with src', () => {
      const html = '<script src="/app.js">fallback</script>';
      const hashes: HashResult[] = [];

      const result = injectIntegrity(html, hashes);

      expect(result).not.toContain('integrity=');
    });

    it('returns original html if no hashes provided', () => {
      const html = '<script>code</script>';
      const hashes: HashResult[] = [];

      const result = injectIntegrity(html, hashes);

      expect(result).toBe(html);
    });
  });

  describe('processHtml', () => {
    it('scans, hashes, and injects integrity in one call', () => {
      const html = '<html><head><script>console.log("test")</script></head></html>';

      const result = processHtml(html);

      expect(result.html).toContain('integrity="sha256-');
      expect(result.hashes.scripts).toHaveLength(1);
      expect(result.hashes.styles).toHaveLength(0);
    });

    it('processes both scripts and styles', () => {
      const html = `
        <html>
          <head>
            <style>body { margin: 0; }</style>
            <script>init();</script>
          </head>
        </html>
      `;

      const result = processHtml(html);

      expect(result.hashes.scripts).toHaveLength(1);
      expect(result.hashes.styles).toHaveLength(1);
    });

    it('collects external resources', () => {
      const html = `
        <html>
          <script src="https://cdn.example.com/lib.js"></script>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css">
        </html>
      `;

      const result = processHtml(html);

      expect(result.externalScripts).toContain('https://cdn.example.com/lib.js');
      expect(result.externalStyles).toContain('https://fonts.googleapis.com/css');
    });

    it('returns empty arrays for plain html', () => {
      const html = '<html><body><p>Hello</p></body></html>';

      const result = processHtml(html);

      expect(result.hashes.scripts).toHaveLength(0);
      expect(result.hashes.styles).toHaveLength(0);
      expect(result.externalScripts).toHaveLength(0);
      expect(result.externalStyles).toHaveLength(0);
    });
  });
});

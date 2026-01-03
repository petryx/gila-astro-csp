import { describe, it, expect } from 'vitest';
import { extractInlineElements } from '../src/scanner';

describe('scanner', () => {
  describe('extractInlineElements', () => {
    it('extracts inline script content', () => {
      const html = '<html><head><script>console.log("hello")</script></head></html>';

      const result = extractInlineElements(html);

      expect(result.scripts).toHaveLength(1);
      expect(result.scripts[0].content).toBe('console.log("hello")');
    });

    it('extracts multiple inline scripts', () => {
      const html = `
        <html>
          <head><script>const a = 1;</script></head>
          <body><script>const b = 2;</script></body>
        </html>
      `;

      const result = extractInlineElements(html);

      expect(result.scripts).toHaveLength(2);
      expect(result.scripts[0].content).toBe('const a = 1;');
      expect(result.scripts[1].content).toBe('const b = 2;');
    });

    it('ignores scripts with src attribute', () => {
      const html = `
        <html>
          <script src="/app.js"></script>
          <script>inline code</script>
        </html>
      `;

      const result = extractInlineElements(html);

      expect(result.scripts).toHaveLength(1);
      expect(result.scripts[0].content).toBe('inline code');
    });

    it('extracts external script URLs', () => {
      const html = `
        <html>
          <script src="https://cdn.example.com/lib.js"></script>
          <script src="/local.js"></script>
        </html>
      `;

      const result = extractInlineElements(html);

      expect(result.externalScripts).toContain('https://cdn.example.com/lib.js');
      expect(result.externalScripts).not.toContain('/local.js');
    });

    it('extracts inline style content', () => {
      const html = '<html><head><style>body { color: red; }</style></head></html>';

      const result = extractInlineElements(html);

      expect(result.styles).toHaveLength(1);
      expect(result.styles[0].content).toBe('body { color: red; }');
    });

    it('extracts multiple inline styles', () => {
      const html = `
        <html>
          <head><style>.a { color: red; }</style></head>
          <body><style>.b { color: blue; }</style></body>
        </html>
      `;

      const result = extractInlineElements(html);

      expect(result.styles).toHaveLength(2);
    });

    it('extracts external stylesheet URLs', () => {
      const html = `
        <html>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
          <link rel="stylesheet" href="/local.css">
        </html>
      `;

      const result = extractInlineElements(html);

      expect(result.externalStyles).toContain('https://fonts.googleapis.com/css?family=Roboto');
      expect(result.externalStyles).not.toContain('/local.css');
    });

    it('returns empty arrays for HTML without scripts or styles', () => {
      const html = '<html><body><p>Hello</p></body></html>';

      const result = extractInlineElements(html);

      expect(result.scripts).toHaveLength(0);
      expect(result.styles).toHaveLength(0);
      expect(result.externalScripts).toHaveLength(0);
      expect(result.externalStyles).toHaveLength(0);
    });

    it('handles script with type="application/ld+json"', () => {
      const html = `
        <html>
          <script type="application/ld+json">{"@type": "Organization"}</script>
          <script>normal code</script>
        </html>
      `;

      const result = extractInlineElements(html);

      expect(result.scripts).toHaveLength(2);
      expect(result.scripts[0].content).toBe('{"@type": "Organization"}');
    });
  });
});

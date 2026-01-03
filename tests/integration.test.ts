import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gilaCSP, buildDirectives, processDirectory } from '../src/integration';
import type { GilaCSPOptions } from '../src/types';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('integration', () => {
  describe('gilaCSP', () => {
    it('returns an Astro integration object', () => {
      const integration = gilaCSP();

      expect(integration).toHaveProperty('name');
      expect(integration).toHaveProperty('hooks');
    });

    it('has correct integration name', () => {
      const integration = gilaCSP();

      expect(integration.name).toBe('gila-astro-csp');
    });

    it('has astro:build:done hook', () => {
      const integration = gilaCSP();

      expect(integration.hooks).toHaveProperty('astro:build:done');
    });

    it('accepts options', () => {
      const options: GilaCSPOptions = {
        presets: ['google-analytics'],
        nginx: { includeComments: false }
      };

      const integration = gilaCSP(options);

      expect(integration.name).toBe('gila-astro-csp');
    });
  });

  describe('buildDirectives', () => {
    it('creates default directives', () => {
      const result = buildDirectives({
        scriptHashes: [],
        styleHashes: [],
        externalScripts: [],
        externalStyles: []
      });

      expect(result['default-src']).toContain("'self'");
    });

    it('adds script hashes to script-src', () => {
      const result = buildDirectives({
        scriptHashes: ['sha256-abc123', 'sha256-def456'],
        styleHashes: [],
        externalScripts: [],
        externalStyles: []
      });

      expect(result['script-src']).toContain("'sha256-abc123'");
      expect(result['script-src']).toContain("'sha256-def456'");
    });

    it('adds style hashes to style-src', () => {
      const result = buildDirectives({
        scriptHashes: [],
        styleHashes: ['sha256-xyz789'],
        externalScripts: [],
        externalStyles: []
      });

      expect(result['style-src']).toContain("'sha256-xyz789'");
    });

    it('adds external script URLs to script-src', () => {
      const result = buildDirectives({
        scriptHashes: [],
        styleHashes: [],
        externalScripts: ['https://cdn.example.com/lib.js'],
        externalStyles: []
      });

      expect(result['script-src']).toContain('https://cdn.example.com');
    });

    it('adds external style URLs to style-src', () => {
      const result = buildDirectives({
        scriptHashes: [],
        styleHashes: [],
        externalScripts: [],
        externalStyles: ['https://fonts.googleapis.com/css']
      });

      expect(result['style-src']).toContain('https://fonts.googleapis.com');
    });

    it('merges preset resources', () => {
      const result = buildDirectives({
        scriptHashes: [],
        styleHashes: [],
        externalScripts: [],
        externalStyles: []
      }, {
        presets: ['google-analytics']
      });

      expect(result['script-src']).toContain('https://www.googletagmanager.com');
      expect(result['connect-src']).toContain('https://www.google-analytics.com');
    });

    it('merges custom directives', () => {
      const result = buildDirectives({
        scriptHashes: [],
        styleHashes: [],
        externalScripts: [],
        externalStyles: []
      }, {
        directives: {
          'img-src': ["'self'", 'data:', 'https:']
        }
      });

      expect(result['img-src']).toContain('data:');
      expect(result['img-src']).toContain('https:');
    });
  });

  describe('processDirectory', () => {
    const testDir = '/tmp/gila-csp-test';

    beforeEach(() => {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
      mkdirSync(testDir, { recursive: true });
    });

    it('processes HTML files in directory', () => {
      const html = '<html><head><script>console.log("test")</script></head></html>';
      writeFileSync(join(testDir, 'index.html'), html);

      const result = processDirectory(testDir);

      expect(result.processedFiles).toBe(1);
      expect(result.scriptHashes.length).toBeGreaterThan(0);
    });

    it('processes nested HTML files', () => {
      mkdirSync(join(testDir, 'blog'), { recursive: true });
      writeFileSync(join(testDir, 'index.html'), '<script>a</script>');
      writeFileSync(join(testDir, 'blog/post.html'), '<script>b</script>');

      const result = processDirectory(testDir);

      expect(result.processedFiles).toBe(2);
    });

    it('updates HTML files with integrity attributes', () => {
      const html = '<html><head><script>console.log("test")</script></head></html>';
      writeFileSync(join(testDir, 'index.html'), html);

      processDirectory(testDir);

      const updated = readFileSync(join(testDir, 'index.html'), 'utf-8');
      expect(updated).toContain('integrity="sha256-');
    });

    it('collects all unique hashes', () => {
      writeFileSync(join(testDir, 'a.html'), '<script>code1</script>');
      writeFileSync(join(testDir, 'b.html'), '<script>code1</script><script>code2</script>');

      const result = processDirectory(testDir);

      expect(result.scriptHashes.length).toBe(2);
    });

    it('returns empty arrays for directory without scripts', () => {
      writeFileSync(join(testDir, 'index.html'), '<html><body>Hello</body></html>');

      const result = processDirectory(testDir);

      expect(result.scriptHashes).toHaveLength(0);
      expect(result.styleHashes).toHaveLength(0);
    });
  });
});

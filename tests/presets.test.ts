import { describe, it, expect } from 'vitest';
import { getPreset, applyPresets, PRESETS } from '../src/presets';
import type { PresetName, Preset } from '../src/types';

describe('presets', () => {
  describe('PRESETS', () => {
    it('contains google-analytics preset', () => {
      expect(PRESETS['google-analytics']).toBeDefined();
    });

    it('contains cloudflare-insights preset', () => {
      expect(PRESETS['cloudflare-insights']).toBeDefined();
    });

    it('contains google-fonts preset', () => {
      expect(PRESETS['google-fonts']).toBeDefined();
    });
  });

  describe('getPreset', () => {
    it('returns google-analytics preset', () => {
      const preset = getPreset('google-analytics');

      expect(preset.name).toBe('google-analytics');
      expect(preset.scripts).toContain('https://www.googletagmanager.com');
    });

    it('returns cloudflare-insights preset', () => {
      const preset = getPreset('cloudflare-insights');

      expect(preset.name).toBe('cloudflare-insights');
      expect(preset.scripts).toBeDefined();
    });

    it('returns google-fonts preset', () => {
      const preset = getPreset('google-fonts');

      expect(preset.name).toBe('google-fonts');
      expect(preset.styles).toContain('https://fonts.googleapis.com');
      expect(preset.fonts).toContain('https://fonts.gstatic.com');
    });

    it('throws for unknown preset', () => {
      expect(() => getPreset('unknown' as PresetName)).toThrow();
    });
  });

  describe('applyPresets', () => {
    it('merges scripts from single preset', () => {
      const result = applyPresets(['google-analytics']);

      expect(result.scripts).toContain('https://www.googletagmanager.com');
    });

    it('merges scripts from multiple presets', () => {
      const result = applyPresets(['google-analytics', 'cloudflare-insights']);

      expect(result.scripts.length).toBeGreaterThan(1);
    });

    it('merges styles from preset', () => {
      const result = applyPresets(['google-fonts']);

      expect(result.styles).toContain('https://fonts.googleapis.com');
    });

    it('merges fonts from preset', () => {
      const result = applyPresets(['google-fonts']);

      expect(result.fonts).toContain('https://fonts.gstatic.com');
    });

    it('merges connect sources from preset', () => {
      const result = applyPresets(['google-analytics']);

      expect(result.connect).toBeDefined();
    });

    it('returns empty arrays for empty presets', () => {
      const result = applyPresets([]);

      expect(result.scripts).toHaveLength(0);
      expect(result.styles).toHaveLength(0);
      expect(result.fonts).toHaveLength(0);
      expect(result.connect).toHaveLength(0);
    });

    it('deduplicates overlapping sources', () => {
      const result = applyPresets(['google-analytics', 'google-analytics']);

      const uniqueScripts = [...new Set(result.scripts)];
      expect(result.scripts).toEqual(uniqueScripts);
    });
  });
});

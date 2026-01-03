import type { PresetName, Preset } from './types';

export interface PresetResources {
  scripts: string[];
  styles: string[];
  fonts: string[];
  connect: string[];
}

export const PRESETS: Record<PresetName, Preset> = {
  'google-analytics': {
    name: 'google-analytics',
    scripts: [
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com'
    ],
    connect: [
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://stats.g.doubleclick.net'
    ]
  },
  'cloudflare-insights': {
    name: 'cloudflare-insights',
    scripts: [
      'https://static.cloudflareinsights.com'
    ],
    connect: [
      'https://cloudflareinsights.com'
    ]
  },
  'google-fonts': {
    name: 'google-fonts',
    styles: [
      'https://fonts.googleapis.com'
    ],
    fonts: [
      'https://fonts.gstatic.com'
    ]
  }
};

export function getPreset(name: PresetName): Preset {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown preset: ${name}`);
  }
  return preset;
}

export function applyPresets(presetNames: PresetName[]): PresetResources {
  const result: PresetResources = {
    scripts: [],
    styles: [],
    fonts: [],
    connect: []
  };

  for (const name of presetNames) {
    const preset = getPreset(name);

    if (preset.scripts) {
      result.scripts.push(...preset.scripts);
    }
    if (preset.styles) {
      result.styles.push(...preset.styles);
    }
    if (preset.fonts) {
      result.fonts.push(...preset.fonts);
    }
    if (preset.connect) {
      result.connect.push(...preset.connect);
    }
  }

  return {
    scripts: [...new Set(result.scripts)],
    styles: [...new Set(result.styles)],
    fonts: [...new Set(result.fonts)],
    connect: [...new Set(result.connect)]
  };
}

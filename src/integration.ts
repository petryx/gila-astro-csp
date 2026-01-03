import type { AstroIntegration } from 'astro';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { GilaCSPOptions, CSPDirectives } from './types.js';
import { processHtml } from './injector.js';
import { applyPresets } from './presets.js';
import { generateNginxConfig } from './nginx.js';

export interface DirectivesInput {
  scriptHashes: string[];
  styleHashes: string[];
  externalScripts: string[];
  externalStyles: string[];
}

export interface ProcessResult {
  processedFiles: number;
  scriptHashes: string[];
  styleHashes: string[];
  externalScripts: string[];
  externalStyles: string[];
}

export function buildDirectives(
  input: DirectivesInput,
  options?: GilaCSPOptions
): Partial<CSPDirectives> {
  const directives: Partial<CSPDirectives> = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"]
  };

  for (const hash of input.scriptHashes) {
    directives['script-src']!.push(`'${hash}'`);
  }

  for (const hash of input.styleHashes) {
    directives['style-src']!.push(`'${hash}'`);
  }

  for (const url of input.externalScripts) {
    const origin = extractOrigin(url);
    if (!directives['script-src']!.includes(origin)) {
      directives['script-src']!.push(origin);
    }
  }

  for (const url of input.externalStyles) {
    const origin = extractOrigin(url);
    if (!directives['style-src']!.includes(origin)) {
      directives['style-src']!.push(origin);
    }
  }

  if (options?.presets) {
    const presetResources = applyPresets(options.presets);

    for (const url of presetResources.scripts) {
      if (!directives['script-src']!.includes(url)) {
        directives['script-src']!.push(url);
      }
    }

    for (const url of presetResources.styles) {
      if (!directives['style-src']!.includes(url)) {
        directives['style-src']!.push(url);
      }
    }

    for (const url of presetResources.fonts) {
      if (!directives['font-src']!.includes(url)) {
        directives['font-src']!.push(url);
      }
    }

    for (const url of presetResources.connect) {
      if (!directives['connect-src']!.includes(url)) {
        directives['connect-src']!.push(url);
      }
    }
  }

  if (options?.directives) {
    for (const [key, values] of Object.entries(options.directives)) {
      const directive = key as keyof CSPDirectives;
      if (values) {
        directives[directive] = [
          ...(directives[directive] || []),
          ...values.filter(v => !directives[directive]?.includes(v))
        ];
      }
    }
  }

  return directives;
}

export function processDirectory(dir: string): ProcessResult {
  const result: ProcessResult = {
    processedFiles: 0,
    scriptHashes: [],
    styleHashes: [],
    externalScripts: [],
    externalStyles: []
  };

  const htmlFiles = findHtmlFiles(dir);

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const processed = processHtml(html);

    writeFileSync(file, processed.html);

    result.processedFiles++;
    result.scriptHashes.push(...processed.hashes.scripts);
    result.styleHashes.push(...processed.hashes.styles);
    result.externalScripts.push(...processed.externalScripts);
    result.externalStyles.push(...processed.externalStyles);
  }

  result.scriptHashes = [...new Set(result.scriptHashes)];
  result.styleHashes = [...new Set(result.styleHashes)];
  result.externalScripts = [...new Set(result.externalScripts)];
  result.externalStyles = [...new Set(result.externalStyles)];

  return result;
}

export function gilaCSP(options?: GilaCSPOptions): AstroIntegration {
  return {
    name: 'gila-astro-csp',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distPath = dir.pathname;
        const result = processDirectory(distPath);

        const directives = buildDirectives({
          scriptHashes: result.scriptHashes,
          styleHashes: result.styleHashes,
          externalScripts: result.externalScripts,
          externalStyles: result.externalStyles
        }, options);

        if (options?.nginx !== false) {
          const nginxOpts = typeof options?.nginx === 'object' ? options.nginx : {};
          const outputPath = nginxOpts.outputPath || './dist/_csp/nginx.conf';
          const config = generateNginxConfig(directives, nginxOpts);

          const outputDir = dirname(outputPath);
          if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
          }
          writeFileSync(outputPath, config);
        }

        if (options?.json !== false) {
          const jsonOpts = typeof options?.json === 'object' ? options.json : {};
          const outputPath = jsonOpts.outputPath || './dist/_csp/hashes.json';
          const pretty = jsonOpts.pretty !== false;

          const outputDir = dirname(outputPath);
          if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
          }

          const jsonContent = {
            scripts: result.scriptHashes,
            styles: result.styleHashes,
            externalScripts: result.externalScripts,
            externalStyles: result.externalStyles,
            directives
          };

          writeFileSync(
            outputPath,
            pretty ? JSON.stringify(jsonContent, null, 2) : JSON.stringify(jsonContent)
          );
        }

        console.log(`[gila-astro-csp] Processed ${result.processedFiles} HTML files`);
        console.log(`[gila-astro-csp] Found ${result.scriptHashes.length} script hashes, ${result.styleHashes.length} style hashes`);
      }
    }
  };
}

function findHtmlFiles(dir: string): string[] {
  const files: string[] = [];

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

import type { AstroIntegration } from 'astro';

export interface GilaCSPOptions {
  /**
   * Presets for common external services
   * @example ['google-analytics', 'cloudflare-insights', 'google-fonts']
   */
  presets?: PresetName[];

  /**
   * Additional external scripts and styles
   */
  external?: {
    scripts?: string[];
    styles?: string[];
  };

  /**
   * Additional CSP directives
   */
  directives?: Partial<CSPDirectives>;

  /**
   * Nginx output configuration
   * Set to false to disable nginx output
   * @default { outputPath: './dist/_csp/nginx.conf' }
   */
  nginx?: NginxOptions | false;

  /**
   * JSON output configuration
   * Set to false to disable JSON output
   * @default { outputPath: './dist/_csp/hashes.json' }
   */
  json?: JsonOptions | false;
}

export interface NginxOptions {
  /**
   * Path to output nginx config file
   * @default './dist/_csp/nginx.conf'
   */
  outputPath?: string;

  /**
   * Include explanatory comments in output
   * @default true
   */
  includeComments?: boolean;
}

export interface JsonOptions {
  /**
   * Path to output JSON file
   * @default './dist/_csp/hashes.json'
   */
  outputPath?: string;

  /**
   * Pretty print JSON
   * @default true
   */
  pretty?: boolean;
}

export type PresetName =
  | 'google-analytics'
  | 'cloudflare-insights'
  | 'google-fonts';

export interface Preset {
  name: PresetName;
  scripts?: string[];
  styles?: string[];
  connect?: string[];
  fonts?: string[];
}

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'frame-ancestors': string[];
  'form-action': string[];
  'base-uri': string[];
}

export interface HashResult {
  hash: string;
  content: string;
  type: 'script' | 'style';
}

export interface ScanResult {
  scripts: InlineElement[];
  styles: InlineElement[];
  externalScripts: string[];
  externalStyles: string[];
}

export interface InlineElement {
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface ProcessedHashes {
  scripts: string[];
  styles: string[];
}

export type GilaCSPIntegration = (options?: GilaCSPOptions) => AstroIntegration;

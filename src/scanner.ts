import type { ScanResult, InlineElement } from './types';

const INLINE_SCRIPT_REGEX = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const EXTERNAL_SCRIPT_REGEX = /<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
const INLINE_STYLE_REGEX = /<style[^>]*>([\s\S]*?)<\/style>/gi;
const EXTERNAL_STYLE_REGEX = /<link[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi;

export function extractInlineElements(html: string): ScanResult {
  const scripts: InlineElement[] = [];
  const styles: InlineElement[] = [];
  const externalScripts: string[] = [];
  const externalStyles: string[] = [];

  // Extract inline scripts
  let match: RegExpExecArray | null;
  const scriptRegex = new RegExp(INLINE_SCRIPT_REGEX.source, 'gi');
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push({
      content: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  // Extract external scripts (only https://)
  const extScriptRegex = new RegExp(EXTERNAL_SCRIPT_REGEX.source, 'gi');
  while ((match = extScriptRegex.exec(html)) !== null) {
    const url = match[1];
    if (url.startsWith('https://')) {
      externalScripts.push(url);
    }
  }

  // Extract inline styles
  const styleRegex = new RegExp(INLINE_STYLE_REGEX.source, 'gi');
  while ((match = styleRegex.exec(html)) !== null) {
    styles.push({
      content: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  // Extract external styles (only https://)
  const extStyleRegex = new RegExp(EXTERNAL_STYLE_REGEX.source, 'gi');
  while ((match = extStyleRegex.exec(html)) !== null) {
    const url = match[1];
    if (url.startsWith('https://')) {
      externalStyles.push(url);
    }
  }

  return {
    scripts,
    styles,
    externalScripts,
    externalStyles
  };
}

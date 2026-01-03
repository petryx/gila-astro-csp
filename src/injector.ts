import type { HashResult, ProcessedHashes } from './types';
import { extractInlineElements } from './scanner';
import { calculateHash, hashInlineElements } from './hasher';

export interface ProcessResult {
  html: string;
  hashes: ProcessedHashes;
  externalScripts: string[];
  externalStyles: string[];
}

export function injectIntegrity(html: string, hashes: HashResult[]): string {
  if (hashes.length === 0) {
    return html;
  }

  let result = html;

  for (const hashResult of hashes) {
    const { content, hash, type } = hashResult;
    const escapedContent = escapeRegex(content);

    if (type === 'script') {
      const regex = new RegExp(
        `(<script)(?![^>]*\\bsrc=)([^>]*>)(${escapedContent})(</script>)`,
        'g'
      );
      result = result.replace(regex, `$1 integrity="${hash}"$2$3$4`);
    } else {
      const regex = new RegExp(
        `(<style)([^>]*>)(${escapedContent})(</style>)`,
        'g'
      );
      result = result.replace(regex, `$1 integrity="${hash}"$2$3$4`);
    }
  }

  return result;
}

export function processHtml(html: string): ProcessResult {
  const scanResult = extractInlineElements(html);

  const scriptHashes = hashInlineElements(scanResult.scripts, 'script');
  const styleHashes = hashInlineElements(scanResult.styles, 'style');

  const allHashes = [...scriptHashes, ...styleHashes];
  const processedHtml = injectIntegrity(html, allHashes);

  return {
    html: processedHtml,
    hashes: {
      scripts: scriptHashes.map(h => h.hash),
      styles: styleHashes.map(h => h.hash)
    },
    externalScripts: scanResult.externalScripts,
    externalStyles: scanResult.externalStyles
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

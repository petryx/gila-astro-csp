import { createHash } from 'node:crypto';
import type { InlineElement, HashResult } from './types';

export function calculateHash(content: string): string {
  const hash = createHash('sha256')
    .update(content, 'utf8')
    .digest('base64');
  return `sha256-${hash}`;
}

export function hashInlineElements(
  elements: InlineElement[],
  type: 'script' | 'style'
): HashResult[] {
  return elements.map(element => ({
    hash: calculateHash(element.content),
    content: element.content,
    type
  }));
}

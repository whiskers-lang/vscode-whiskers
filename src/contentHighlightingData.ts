import { parse } from './parser';

export interface ContentRange {
    offset: number;
    length: number;
}

interface ContentHighlightingRanges {
    plaintext: ContentRange[];
    template: ContentRange[];
}

export function normalizeOpacity(opacity: number): number {
    return Math.round(Math.min(1, Math.max(0, opacity)) * 100) / 100;
}

export function collectPlaintextContentRanges(text: string): ContentRange[] {
    return collectContentHighlightingRanges(text).plaintext;
}

export function collectTemplateRanges(text: string): ContentRange[] {
    return collectContentHighlightingRanges(text).template;
}

export function collectContentHighlightingRanges(text: string): ContentHighlightingRanges {
    const plaintext: ContentRange[] = [];
    const template: ContentRange[] = [];
    let offset = 0;

    for (const tag of parse(text)) {
        if (tag.tagOffset > offset) {
            plaintext.push({ offset, length: tag.tagOffset - offset });
        }
        template.push({ offset: tag.tagOffset, length: tag.tagLength });
        offset = Math.max(offset, tag.tagOffset + tag.tagLength);
    }

    if (offset < text.length) {
        plaintext.push({ offset, length: text.length - offset });
    }
    return { plaintext, template };
}

import { parse } from './parser';

export interface ContentRange {
    offset: number;
    length: number;
}

export function collectPlaintextContentRanges(text: string): ContentRange[] {
    const ranges: ContentRange[] = [];
    let offset = 0;

    for (const tag of parse(text)) {
        if (tag.tagOffset > offset) {
            ranges.push({ offset, length: tag.tagOffset - offset });
        }
        offset = Math.max(offset, tag.tagOffset + tag.tagLength);
    }

    if (offset < text.length) {
        ranges.push({ offset, length: text.length - offset });
    }
    return ranges;
}

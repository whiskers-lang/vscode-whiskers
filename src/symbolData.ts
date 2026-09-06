import { parse } from './parser';

export type SymbolDataKind = 'section' | 'parent' | 'block' | 'partial' | 'array';

export interface SymbolData {
    name: string;
    detail: string;
    kind: SymbolDataKind;
    offset: number;
    length: number;
    selectionOffset: number;
    selectionLength: number;
    children: SymbolData[];
}

interface SectionFrame {
    name: string;
    symbol: SymbolData;
}

export function collectDocumentSymbols(text: string): SymbolData[] {
    const topLevel: SymbolData[] = [];
    const stack: SectionFrame[] = [];

    const append = (symbol: SymbolData): void => {
        const parent = stack[stack.length - 1]?.symbol;
        (parent?.children ?? topLevel).push(symbol);
    };

    for (const tag of parse(text)) {
        if (tag.kind === 'section-open') {
            const symbol: SymbolData = {
                name: tag.sigil + tag.name,
                detail: '',
                kind: sectionKind(tag.sigil),
                offset: tag.tagOffset,
                length: tag.tagLength,
                selectionOffset: tag.nameOffset,
                selectionLength: tag.nameLength,
                children: [],
            };
            append(symbol);
            stack.push({ name: tag.name, symbol });
            continue;
        }

        if (tag.kind === 'partial') {
            append({
                name: `${tag.sigil} ${tag.name}`,
                detail: tag.sigil === '>*' ? 'Dynamic partial' : 'Partial',
                kind: 'partial',
                offset: tag.tagOffset,
                length: tag.tagLength,
                selectionOffset: tag.nameOffset,
                selectionLength: tag.nameLength,
                children: [],
            });
            continue;
        }

        if (tag.kind !== 'section-close') continue;
        const frame = stack.pop();
        if (!frame) {
            append(malformedClose(tag.name, tag.tagOffset, tag.tagLength, tag.nameOffset, tag.nameLength));
        } else {
            frame.symbol.length = tag.tagOffset + tag.tagLength - frame.symbol.offset;
            if (frame.name !== tag.name) {
                frame.symbol.detail = `Mismatched closing tag: expected /${frame.name}, found /${tag.name}`;
            }
        }
    }

    for (const frame of stack) {
        frame.symbol.length = Math.max(frame.symbol.length, text.length - frame.symbol.offset);
        frame.symbol.detail = 'Unclosed section';
    }

    return topLevel;
}

function malformedClose(
    name: string,
    offset: number,
    length: number,
    selectionOffset: number,
    selectionLength: number,
): SymbolData {
    return {
        name: `/${name}`,
        detail: 'Unmatched closing tag',
        kind: 'section',
        offset,
        length,
        selectionOffset,
        selectionLength,
        children: [],
    };
}

function sectionKind(sigil: string): SymbolDataKind {
    switch (sigil) {
        case '*': return 'array';
        case '$': return 'block';
        case '<': return 'parent';
        default: return 'section';
    }
}
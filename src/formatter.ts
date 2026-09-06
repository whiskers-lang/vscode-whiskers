import type { FormattingOptions, Range, TextDocument } from 'vscode';
import { parse, TagKind } from './parser';

function standaloneSections(text: string): Map<number, TagKind> {
    const sections = new Map<number, TagKind>();
    for (const tag of parse(text)) {
        if (tag.kind !== 'section-open' && tag.kind !== 'section-close') continue;

        const lineStart = text.lastIndexOf('\n', tag.tagOffset - 1) + 1;
        const tagEnd = tag.tagOffset + tag.tagLength;
        const newline = text.indexOf('\n', tagEnd);
        let lineEnd = newline === -1 ? text.length : newline;
        if (lineEnd > lineStart && text[lineEnd - 1] === '\r') lineEnd--;

        if (
            tagEnd <= lineEnd &&
            text.slice(lineStart, tag.tagOffset).trim() === '' &&
            text.slice(tagEnd, lineEnd).trim() === ''
        ) {
            sections.set(lineStart, tag.kind);
        }
    }
    return sections;
}

export function formatDocument(
    text: string,
    options: FormattingOptions,
): string {
    return formatText(text, options, standaloneSections(text), 0, 0);
}

function formatText(
    text: string,
    options: FormattingOptions,
    sections: Map<number, TagKind>,
    baseOffset: number,
    initialDepth: number,
): string {
    const indent = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
    const lines = text.split(/\r?\n/);
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const out: string[] = [];
    let localOffset = 0;
    let depth = initialDepth;

    for (const raw of lines) {
        const section = sections.get(baseOffset + localOffset);
        if (section === 'section-close') {
            depth = Math.max(0, depth - 1);
            out.push(indent.repeat(depth) + raw.trim());
        } else if (section === 'section-open') {
            out.push(indent.repeat(depth) + raw.trim());
            depth++;
        } else {
            const content = raw.trimEnd();
            if (content === '') {
                out.push('');
            } else {
                // Reindent content lines to match current block depth.
                out.push(indent.repeat(depth) + content.trimStart());
            }
        }

        localOffset += raw.length;
        if (text.startsWith('\r\n', localOffset)) localOffset += 2;
        else if (text[localOffset] === '\n') localOffset++;
    }

    // Trim any trailing empty lines added by the split, then restore a single trailing newline.
    while (out.length > 0 && out[out.length - 1] === '') {
        out.pop();
    }

    return out.join(eol) + eol;
}

export function formatRange(
    text: string,
    range: Range,
    options: FormattingOptions,
    document: TextDocument,
): string {
    const sections = standaloneSections(document.getText());
    const baseOffset = document.offsetAt(range.start);
    let initialDepth = 0;
    for (const [lineOffset, section] of sections) {
        if (lineOffset >= baseOffset) break;
        initialDepth = section === 'section-open'
            ? initialDepth + 1
            : Math.max(0, initialDepth - 1);
    }
    return formatText(text, options, sections, baseOffset, initialDepth);
}

import { parse, Tag } from './parser';
import { METADATA_COMPLETIONS } from './completionData';

export type DiagnosticCode =
    | 'unmatched-close'
    | 'unclosed-section'
    | 'mismatched-section'
    | 'malformed-delimiter-change'
    | 'duplicate-alias'
    | 'alias-out-of-scope';

export interface DiagnosticData {
    code: DiagnosticCode;
    message: string;
    offset: number;
    length: number;
    severity: 'error' | 'warning';
}

const METADATA_NAMES = new Set(METADATA_COMPLETIONS.map(metadata => metadata.name));
const ITERATION_METADATA_NAMES = new Set(
    METADATA_COMPLETIONS.filter(metadata => metadata.name !== 'root')
        .map(metadata => metadata.name),
);

export function collectDiagnostics(text: string): DiagnosticData[] {
    const tags = parse(text);
    const diagnostics = collectSectionDiagnostics(tags);
    diagnostics.push(...collectDelimiterDiagnostics(text));
    diagnostics.push(...collectAliasDiagnostics(tags));
    return diagnostics.sort((left, right) => left.offset - right.offset);
}

function collectSectionDiagnostics(tags: Tag[]): DiagnosticData[] {
    const diagnostics: DiagnosticData[] = [];
    const sections: Tag[] = [];

    for (const tag of tags) {
        if (tag.kind === 'section-open') {
            sections.push(tag);
            continue;
        }
        if (tag.kind !== 'section-close') continue;

        const opening = sections.pop();
        if (!opening) {
            diagnostics.push({
                code: 'unmatched-close',
                message: `Closing tag "${tag.name}" has no matching opening tag.`,
                ...nameRange(tag),
                severity: 'error',
            });
        } else if (opening.name !== tag.name) {
            diagnostics.push({
                code: 'mismatched-section',
                message: `Closing tag "${tag.name}" does not match opening tag "${opening.name}".`,
                ...nameRange(tag),
                severity: 'error',
            });
        }
    }

    for (const tag of sections) {
        diagnostics.push({
            code: 'unclosed-section',
            message: `Section "${tag.name}" is not closed.`,
            ...nameRange(tag),
            severity: 'error',
        });
    }

    return diagnostics;
}

function collectDelimiterDiagnostics(text: string): DiagnosticData[] {
    const diagnostics: DiagnosticData[] = [];
    let openDelimiter = '{{';
    let closeDelimiter = '}}';
    let position = 0;

    while (position < text.length) {
        const openOffset = text.indexOf(openDelimiter, position);
        if (openOffset === -1) break;

        const contentOffset = openOffset + openDelimiter.length;
        const closeOffset = text.indexOf(closeDelimiter, contentOffset);
        if (closeOffset === -1) {
            if (text.slice(contentOffset).trimStart().startsWith('=')) {
                diagnostics.push(malformedDelimiterDiagnostic(openOffset, text.length - openOffset));
            }
            break;
        }

        const tagEnd = closeOffset + closeDelimiter.length;
        const content = text.slice(contentOffset, closeOffset).trim();
        if (content.startsWith('=')) {
            const delimiters = parseDelimiterChange(content);
            if (delimiters) {
                [openDelimiter, closeDelimiter] = delimiters;
            } else {
                diagnostics.push(malformedDelimiterDiagnostic(openOffset, tagEnd - openOffset));
            }
        }
        position = tagEnd;
    }

    return diagnostics;
}

function parseDelimiterChange(content: string): [string, string] | undefined {
    if (!content.endsWith('=')) return undefined;
    const parts = content.slice(1, -1).trim().split(/\s+/);
    if (parts.length !== 2 || parts.some(part => part.length === 0 || part.includes('='))) {
        return undefined;
    }
    return [parts[0], parts[1]];
}

function malformedDelimiterDiagnostic(offset: number, length: number): DiagnosticData {
    return {
        code: 'malformed-delimiter-change',
        message: 'Delimiter change must contain two non-empty delimiters and end with "=".',
        offset,
        length: Math.max(1, length),
        severity: 'error',
    };
}

function collectAliasDiagnostics(tags: Tag[]): DiagnosticData[] {
    const aliasNames = new Set(tags.flatMap(tag => tag.aliases.map(alias => alias.name)));
    const diagnostics: DiagnosticData[] = [];

    for (const tag of tags) {
        for (const alias of tag.aliases) {
            if (METADATA_NAMES.has(alias.name)) {
                diagnostics.push({
                    code: 'duplicate-alias',
                    message: `Alias "${alias.name}" conflicts with metadata "@${alias.name}".`,
                    offset: alias.offset,
                    length: alias.length,
                    severity: 'error',
                });
                continue;
            }
            if (!tag.scopeAliases.some(active => active.name === alias.name)) continue;
            diagnostics.push({
                code: 'duplicate-alias',
                message: `Alias "${alias.name}" duplicates an alias from an enclosing section.`,
                offset: alias.offset,
                length: alias.length,
                severity: 'error',
            });
        }

        const reference = aliasReference(tag);
        if (!reference || !aliasNames.has(reference.name)) continue;
        if (tag.scopeAliases.some(alias => alias.name === reference.name)) continue;

        diagnostics.push({
            code: 'alias-out-of-scope',
            message: `Alias "${reference.name}" is referenced outside its scope.`,
            offset: reference.offset,
            length: reference.name.length,
            severity: 'warning',
        });
    }

    return diagnostics;
}

function aliasReference(tag: Tag): { name: string; offset: number } | undefined {
    if (
        tag.kind !== 'variable' &&
        tag.kind !== 'variable-meta' &&
        tag.kind !== 'triple' &&
        tag.kind !== 'unescaped'
    ) return undefined;

    if (tag.name.startsWith('@')) {
        const segments = tag.name.slice(1).split('.');
        if (segments.length !== 2 || !ITERATION_METADATA_NAMES.has(segments[1])) return undefined;
        return { name: segments[0], offset: tag.nameOffset + 1 };
    }

    const name = tag.name.split('.')[0];
    return name ? { name, offset: tag.nameOffset } : undefined;
}

function nameRange(tag: Tag): Pick<DiagnosticData, 'offset' | 'length'> {
    return tag.nameLength > 0
        ? { offset: tag.nameOffset, length: tag.nameLength }
        : { offset: tag.tagOffset, length: tag.tagLength };
}
import * as fs from 'fs';
import * as path from 'path';
import { parse } from './parser';

const PARTIAL_EXTS = ['.whiskers', '.wsk', '.mustache', '.mst', '.html'];

export type DefinitionTarget =
    | { kind: 'range'; offset: number; length: number }
    | { kind: 'file'; path: string };

export function resolveTemplateRoots(
    configuredRoots: readonly string[],
    baseDirectory: string,
): string[] {
    return configuredRoots
        .map(root => root.trim())
        .filter(root => root.length > 0)
        .map(root => path.resolve(baseDirectory, root));
}

export function findDefinitionTarget(
    text: string,
    offset: number,
    documentPath: string,
    templateRoots: readonly string[] = [],
): DefinitionTarget | undefined {
    const tag = parse(text).find(candidate =>
        offset >= candidate.tagOffset && offset < candidate.tagOffset + candidate.tagLength);
    if (!tag) return undefined;

    if (
        (tag.kind === 'variable' || tag.kind === 'triple' || tag.kind === 'unescaped') &&
        offset >= tag.nameOffset && offset < tag.nameOffset + tag.nameLength
    ) {
        const declaration = tag.scopeAliases.find(alias => alias.name === tag.name);
        if (declaration) {
            return { kind: 'range', offset: declaration.offset, length: declaration.length };
        }
    }

    if (
        tag.kind === 'partial' && tag.sigil === '>' &&
        offset >= tag.nameOffset && offset < tag.nameOffset + tag.nameLength
    ) {
        const partialPath = resolvePartial(documentPath, tag.name, templateRoots);
        if (partialPath) return { kind: 'file', path: partialPath };
    }

    return undefined;
}

function resolvePartial(
    documentPath: string,
    name: string,
    templateRoots: readonly string[],
): string | undefined {
    for (const root of templateRoots) {
        const partialPath = findPartialIn(root, name);
        if (partialPath) return partialPath;
    }

    let directory = path.dirname(documentPath);
    while (true) {
        const partialPath = findPartialIn(directory, name);
        if (partialPath) return partialPath;
        const parent = path.dirname(directory);
        if (parent === directory) break;
        directory = parent;
    }
    return undefined;
}

function findPartialIn(directory: string, name: string): string | undefined {
    for (const extension of PARTIAL_EXTS) {
        const candidate = path.join(directory, name + extension);
        if (isFile(candidate)) return candidate;
    }
    const bare = path.join(directory, name);
    if (isFile(bare)) return bare;
    return undefined;
}

function isFile(candidate: string): boolean {
    try {
        return fs.statSync(candidate).isFile();
    } catch {
        return false;
    }
}
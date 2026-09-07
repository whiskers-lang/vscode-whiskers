import { AliasDecl, Tag, parse } from './parser';
import { METADATA_COMPLETIONS } from './completionData';

const ITERATION_METADATA_NAMES = new Set(
    METADATA_COMPLETIONS.filter(metadata => metadata.name !== 'root')
        .map(metadata => metadata.name),
);

export interface TextRange {
    offset: number;
    length: number;
}

export interface AliasRenameTarget {
    name: string;
    declaration: TextRange;
    references: TextRange[];
}

export function findAliasRenameTarget(
    text: string,
    offset: number,
): AliasRenameTarget | undefined {
    const tags = parse(text);
    const declaration = findDeclarationAt(tags, offset) ?? findReferenceAt(tags, offset)?.declaration;
    if (!declaration) return undefined;

    const references = tags.flatMap(tag => {
        const reference = aliasReference(tag);
        if (!reference || reference.declaration.offset !== declaration.offset) return [];
        return [{ offset: reference.offset, length: reference.length }];
    });

    return {
        name: declaration.name,
        declaration: { offset: declaration.offset, length: declaration.length },
        references,
    };
}

export function findAliasDeclaration(text: string, offset: number): TextRange | undefined {
    const reference = findReferenceAt(parse(text), offset);
    return reference
        ? { offset: reference.declaration.offset, length: reference.declaration.length }
        : undefined;
}

export function isValidAliasName(name: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(name) && !name.startsWith('@');
}

function findDeclarationAt(tags: Tag[], offset: number): AliasDecl | undefined {
    return tags.flatMap(tag => tag.aliases).find(alias =>
        offset >= alias.offset && offset <= alias.offset + alias.length);
}

function findReferenceAt(
    tags: Tag[],
    offset: number,
): { declaration: AliasDecl; offset: number; length: number } | undefined {
    for (const tag of tags) {
        const reference = aliasReference(tag);
        if (reference && offset >= reference.offset && offset <= reference.offset + reference.length) {
            return reference;
        }
    }
    return undefined;
}

function aliasReference(
    tag: Tag,
): { declaration: AliasDecl; offset: number; length: number } | undefined {
    if (!usesContextKeypath(tag)) return undefined;

    const metadataSegments = tag.name.startsWith('@') ? tag.name.slice(1).split('.') : [];
    const qualifiedMetadata = metadataSegments.length === 2 &&
        ITERATION_METADATA_NAMES.has(metadataSegments[1]);
    const local = tag.name.startsWith('.');
    const nameOffset = tag.nameOffset + (qualifiedMetadata || local ? 1 : 0);
    const name = qualifiedMetadata
        ? metadataSegments[0]
        : tag.name.slice(local ? 1 : 0).split('.')[0];
    if (!name) return undefined;

    const declaration = [...tag.scopeAliases]
        .reverse()
        .find(alias => alias.name === name);
    return declaration
        ? { declaration, offset: nameOffset, length: name.length }
        : undefined;
}

function usesContextKeypath(tag: Tag): boolean {
    return tag.kind === 'variable' ||
        tag.kind === 'variable-meta' ||
        tag.kind === 'triple' ||
        tag.kind === 'unescaped' ||
        tag.kind === 'section-open' ||
        tag.kind === 'section-close' ||
        (tag.kind === 'partial' && tag.sigil === '>*');
}
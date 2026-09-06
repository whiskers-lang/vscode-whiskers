import { parse, AliasDecl, Tag } from './parser';

export const TOKEN_TYPES = [
    'mustacheDelimiter',
    'mustacheSigil',
    'mustacheSection',
    'mustacheVariable',
    'mustacheMetadata',
    'mustachePartial',
    'mustacheLambda',
    'mustacheStringArgument',
    'mustacheNumberArgument',
    'parameter',
];
export const TOKEN_MODS = ['declaration', 'depth1', 'depth2', 'depth3', 'depth4', 'depth5', 'depth6'];

type TokenType = typeof TOKEN_TYPES[number];

export interface SemanticTokenData {
    offset: number;
    length: number;
    type: TokenType;
    mods: number;
}

export function collectSemanticTokens(text: string): SemanticTokenData[] {
    const pending: SemanticTokenData[] = [];
    const sectionTypes: TokenType[] = [];

    for (const tag of parse(text)) {
        if (tag.kind === 'comment') continue;

        push(pending, tag.tagOffset, tag.openDelimLen, 'mustacheDelimiter', 0);
        push(pending, tag.tagOffset + tag.tagLength - tag.closeDelimLen, tag.closeDelimLen, 'mustacheDelimiter', 0);

        if (tag.kind === 'set-delimiter') continue;

        push(pending, tag.sigilOffset, tag.sigilLength, 'mustacheSigil', 0);

        if (tag.kind === 'section-open') {
            const sectionType = tag.hasArguments ? 'mustacheLambda' : 'mustacheSection';
            push(pending, tag.nameOffset, tag.nameLength,
                sectionType, depthMod(tag.depth));
            sectionTypes.push(sectionType);
            for (const alias of tag.aliases) {
                push(pending, alias.offset, alias.length, 'parameter', modBit('declaration'));
            }
            for (const argument of tag.arguments) {
                if (argument.kind === 'dynamic') {
                    push(pending, argument.sigilOffset ?? argument.offset, 1, 'mustacheSigil', 0);
                    push(pending, argument.offset, argument.length, 'mustacheVariable', 0);
                } else {
                    push(pending, argument.offset, argument.length,
                        argument.kind === 'number' ? 'mustacheNumberArgument' : 'mustacheStringArgument', 0);
                }
            }
        } else if (tag.kind === 'section-close') {
            const sectionType = sectionTypes.pop() ?? 'mustacheSection';
            push(pending, tag.nameOffset, tag.nameLength, sectionType, depthMod(tag.depth));
        } else if (tag.kind === 'partial') {
            push(pending, tag.nameOffset, tag.nameLength, 'mustachePartial', 0);
        } else if (tag.kind === 'variable-meta') {
            push(pending, tag.nameOffset, tag.nameLength, 'mustacheMetadata', 0);
        } else if (tag.kind === 'variable' || tag.kind === 'triple' || tag.kind === 'unescaped') {
            push(pending, tag.nameOffset, tag.nameLength,
                isAlias(tag, tag.scopeAliases) ? 'parameter' : 'mustacheVariable', 0);
        }
    }

    return pending.sort((a, b) => a.offset - b.offset);
}

function isAlias(tag: Tag, scope: AliasDecl[]): boolean {
    return scope.some(alias => alias.name === tag.name);
}

function modBit(modifier: string): number {
    return 1 << TOKEN_MODS.indexOf(modifier);
}

function depthMod(depth: number): number {
    return modBit('depth' + ((depth % 6) + 1));
}

function push(
    tokens: SemanticTokenData[],
    offset: number,
    length: number,
    type: TokenType,
    mods: number,
): void {
    if (length > 0) tokens.push({ offset, length, type, mods });
}
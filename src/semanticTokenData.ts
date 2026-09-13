import { parse, AliasDecl, Tag } from './parser';

export const TOKEN_TYPES = [
    'whiskersDelimiter',
    'whiskersComment',
    'whiskersSigil',
    'whiskersSection',
    'whiskersVariable',
    'whiskersMetadata',
    'whiskersPartial',
    'whiskersLambda',
    'whiskersStringArgument',
    'whiskersNumberArgument',
    'whiskersAlias',
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
        if (tag.kind === 'comment') {
            push(pending, tag.tagOffset, tag.tagLength, 'whiskersComment', 0);
            continue;
        }

        push(pending, tag.tagOffset, tag.openDelimLen, 'whiskersDelimiter', 0);
        push(pending, tag.tagOffset + tag.tagLength - tag.closeDelimLen, tag.closeDelimLen, 'whiskersDelimiter', 0);

        if (tag.kind === 'set-delimiter') continue;

        push(pending, tag.sigilOffset, tag.sigilLength, 'whiskersSigil', 0);

        if (tag.kind === 'section-open') {
            const sectionType = tag.hasArguments ? 'whiskersLambda' : 'whiskersSection';
            push(pending, tag.nameOffset, tag.nameLength,
                sectionType, depthMod(tag.depth));
            sectionTypes.push(sectionType);
            for (const alias of tag.aliases) {
                push(pending, alias.offset, alias.length, 'whiskersAlias', modBit('declaration'));
            }
            for (const argument of tag.arguments) {
                if (argument.kind === 'dynamic') {
                    push(pending, argument.sigilOffset ?? argument.offset, 1, 'whiskersSigil', 0);
                    push(pending, argument.offset, argument.length, 'whiskersVariable', 0);
                } else {
                    push(pending, argument.offset, argument.length,
                        argument.kind === 'number' ? 'whiskersNumberArgument' : 'whiskersStringArgument', 0);
                }
            }
        } else if (tag.kind === 'section-close') {
            const sectionType = sectionTypes.pop() ?? 'whiskersSection';
            push(pending, tag.nameOffset, tag.nameLength, sectionType, depthMod(tag.depth));
        } else if (tag.kind === 'partial') {
            push(pending, tag.nameOffset, tag.nameLength, 'whiskersPartial', 0);
        } else if (tag.kind === 'variable-meta') {
            push(pending, tag.nameOffset, tag.nameLength, 'whiskersMetadata', 0);
        } else if (tag.kind === 'variable' || tag.kind === 'triple' || tag.kind === 'unescaped') {
            push(pending, tag.nameOffset, tag.nameLength,
                isAlias(tag, tag.scopeAliases) ? 'whiskersAlias' : 'whiskersVariable', 0);
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
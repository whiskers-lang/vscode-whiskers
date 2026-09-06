export type TagKind =
    | 'variable' | 'triple' | 'unescaped' | 'variable-meta'
    | 'section-open' | 'section-close'
    | 'partial' | 'comment' | 'set-delimiter';

export interface AliasDecl {
    name: string;
    offset: number;   // document offset of the alias name text (after ':')
    length: number;
    depth: number;    // nesting depth at which this alias was declared
}

export interface LambdaArgument {
    kind: 'string' | 'number' | 'dynamic';
    offset: number;
    length: number;
    sigilOffset?: number;
}

export interface Tag {
    kind: TagKind;
    sigil: string;
    sigilOffset: number;
    sigilLength: number;
    name: string;
    nameOffset: number;
    nameLength: number;
    tagOffset: number;
    tagLength: number;
    openDelimLen: number;
    closeDelimLen: number;
    customDelim: boolean;
    depth: number;
    hasArguments: boolean;
    arguments: LambdaArgument[];
    aliases: AliasDecl[];       // non-empty only for section-open
    scopeAliases: AliasDecl[];  // all aliases in scope at this tag's position
}

interface ScopeFrame { aliases: AliasDecl[]; }

const BLOCK_SIGILS = new Set([...'#^*%?<~$']);

export function parse(text: string): Tag[] {
    const tags: Tag[] = [];
    const scopeStack: ScopeFrame[] = [];
    let openDelim = '{{';
    let closeDelim = '}}';
    let pos = 0;
    let depth = 0;

    function currentAliases(): AliasDecl[] {
        return scopeStack.flatMap(f => f.aliases);
    }

    while (pos < text.length) {
        const openIdx = text.indexOf(openDelim, pos);
        if (openIdx === -1) break;

        // Triple stache: only when using default delimiters
        if (openDelim === '{{' && text[openIdx + 2] === '{') {
            const ci = text.indexOf('}}}', openIdx + 3);
            if (ci === -1) break;
            const inner = text.slice(openIdx + 3, ci);
            const trimmed = inner.trim();
            const nameOff = openIdx + 3 + (inner.length - inner.trimStart().length);
            tags.push({
                kind: 'triple', sigil: '{{{', name: trimmed,
                sigilOffset: openIdx, sigilLength: 0,
                nameOffset: nameOff, nameLength: trimmed.length,
                tagOffset: openIdx, tagLength: ci + 3 - openIdx,
                openDelimLen: 3, closeDelimLen: 3, customDelim: false,
                depth, hasArguments: false, arguments: [], aliases: [], scopeAliases: currentAliases(),
            });
            pos = ci + 3;
            continue;
        }

        const closeIdx = text.indexOf(closeDelim, openIdx + openDelim.length);
        if (closeIdx === -1) break;

        const base = openIdx + openDelim.length;
        const inner = text.slice(base, closeIdx);
        const tagLength = closeIdx + closeDelim.length - openIdx;

        const tag = classifyTag(inner, base, openIdx, tagLength, depth, openDelim.length, closeDelim.length, openDelim !== '{{' || closeDelim !== '}}');

        if (tag !== null) {
            if (tag.kind === 'section-close') {
                if (scopeStack.length > 0) scopeStack.pop();
                depth = Math.max(0, depth - 1);
                tag.depth = depth;
                tag.scopeAliases = currentAliases();
            } else if (tag.kind === 'section-open') {
                tag.scopeAliases = currentAliases();
                scopeStack.push({ aliases: tag.aliases });
                depth++;
            } else {
                tag.scopeAliases = currentAliases();
            }

            if (tag.kind === 'set-delimiter') {
                const parts = tag.name.trim().split(/\s+/);
                if (parts.length === 2) { openDelim = parts[0]; closeDelim = parts[1]; }
            }

            tags.push(tag);
        }
        pos = openIdx + tagLength;
    }

    return tags;
}

function skipWs(s: string, i: number): number {
    while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\r' || s[i] === '\n')) i++;
    return i;
}

function readWord(s: string, i: number): [string, number] {
    const start = i;
    while (i < s.length && /[\w./@-]/.test(s[i])) i++;
    return [s.slice(start, i), i];
}

function classifyTag(
    inner: string, base: number,
    tagOffset: number, tagLength: number, depth: number,
    openDelimLen: number, closeDelimLen: number, customDelim: boolean,
): Tag | null {
    let i = skipWs(inner, 0);
    if (i >= inner.length) return null;
    const first = inner[i];

    const make = (
        kind: TagKind, sigil: string, name: string, nameI: number,
        sigilI = i, sigilLength = sigil.length,
    ): Tag => ({
        kind, sigil, name,
        sigilOffset: base + sigilI, sigilLength,
        nameOffset: base + nameI, nameLength: name.length,
        tagOffset, tagLength, openDelimLen, closeDelimLen, customDelim,
        depth, hasArguments: false, arguments: [], aliases: [], scopeAliases: [],
    });

    if (first === '!') {
        const rest = inner.slice(i + 1).replace(/^-?-?\s*/, '').replace(/\s*-?-?$/, '').trim();
        return make('comment', '!', rest, i + 1);
    }

    if (first === '=') {
        const content = inner.slice(i + 1, inner.lastIndexOf('=')).trim();
        return make('set-delimiter', '=', content, i + 1);
    }

    if (first === '/') {
        const sigilI = i;
        i = skipWs(inner, i + 1);
        const [name] = readWord(inner, i);
        return make('section-close', '/', name, i, sigilI);
    }

    if (first === '&') {
        const sigilI = i;
        i = skipWs(inner, i + 1);
        const [name] = readWord(inner, i);
        return make('unescaped', '&', name, i, sigilI);
    }

    if (first === '>') {
        const sigilI = i;
        i++;
        const sigil = i < inner.length && inner[i] === '*' ? '>*' : '>';
        if (sigil === '>*') i++;
        i = skipWs(inner, i);
        const [name] = readWord(inner, i);
        return make('partial', sigil, name, i, sigilI);
    }

    // variable-meta: @name with no further content → not a section
    if (first === '@') {
        const [name, j] = readWord(inner, i);
        if (!inner.slice(j).trim()) {
            return make('variable-meta', '@', name, i, i, 0);
        }
        // else fall through to BLOCK_SIGILS (@ as section sigil)
    }

    if (BLOCK_SIGILS.has(first)) {
        const sigilI = i;
        i++;
        i = skipWs(inner, i);
        const nameStart = i;
        const [name, j] = readWord(inner, i);

        const aliases: AliasDecl[] = [];
        const afterName = inner.slice(j);
        const aliasRe = /:([\w][\w./@-]*)/g;
        let am: RegExpExecArray | null;
        while ((am = aliasRe.exec(afterName)) !== null) {
            aliases.push({
                name: am[1],
                offset: base + j + am.index + 1,
                length: am[1].length,
                depth,
            });
        }

        let argumentStart = skipWs(inner, j);
        if (inner[argumentStart] === ':') {
            [, argumentStart] = readWord(inner, argumentStart + 1);
        }
        argumentStart = skipWs(inner, argumentStart);
        const arguments_ = readArguments(inner.slice(argumentStart), base + argumentStart);
        return {
            kind: 'section-open', sigil: first, name,
            sigilOffset: base + sigilI, sigilLength: 1,
            nameOffset: base + nameStart, nameLength: name.length,
            tagOffset, tagLength, openDelimLen, closeDelimLen, customDelim,
            depth, hasArguments: arguments_.length > 0, arguments: arguments_, aliases, scopeAliases: [],
        };
    }

    // Plain variable
    const [name] = readWord(inner, i);
    return make('variable', '', name, i, i, 0);
}

function readArguments(text: string, base: number): LambdaArgument[] {
    const arguments_: LambdaArgument[] = [];
    let i = 0;

    while ((i = skipWs(text, i)) < text.length) {
        const start = i;
        if (text[i] === '"') {
            i++;
            while (i < text.length && text[i] !== '"') {
                i += text[i] === '\\' && i + 1 < text.length ? 2 : 1;
            }
            if (i < text.length) i++;
            arguments_.push({ kind: 'string', offset: base + start, length: i - start });
        } else if (text[i] === '*') {
            i++;
            const valueStart = i;
            while (i < text.length && /[\w./@-]/.test(text[i])) i++;
            if (i > valueStart) {
                arguments_.push({
                    kind: 'dynamic', offset: base + valueStart, length: i - valueStart,
                    sigilOffset: base + start,
                });
            }
        } else if (/\d/.test(text[i])) {
            while (i < text.length && /[\d.]/.test(text[i])) i++;
            arguments_.push({ kind: 'number', offset: base + start, length: i - start });
        } else {
            while (i < text.length && /[\w-]/.test(text[i])) i++;
            if (i > start) {
                arguments_.push({ kind: 'string', offset: base + start, length: i - start });
            } else {
                i++;
            }
        }
    }

    return arguments_;
}

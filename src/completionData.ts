import { parse } from './parser';

export interface SigilCompletionData {
    sigil: string;
    label: string;
    description: string;
}

export interface MetadataCompletionData {
    name: string;
    label: string;
    description: string;
}

export const SIGIL_COMPLETIONS: readonly SigilCompletionData[] = [
    { sigil: '#', label: 'Value is truthy', description: 'Render when the value is truthy.' },
    { sigil: '^', label: 'Value is falsy', description: 'Render when the value is falsy.' },

    { sigil: '~', label: 'Value is not null', description: 'Render when the key exists and its value is not null.' },
    { sigil: '?', label: 'Value is null', description: 'Render when the key exists and its value is null.' },

    { sigil: '*', label: 'Key is present', description: 'Render when the key exists.' },
    { sigil: '%', label: 'Key is absent', description: 'Render when the key is absent.' },

    { sigil: '<', label: 'Parent template', description: 'Open a parent template block.' },
    { sigil: '$', label: 'Named block', description: 'Define or override a named block.' },
    { sigil: '/', label: 'Close section', description: 'Close the current section.' },
    { sigil: '>', label: 'Partial', description: 'Render a partial template.' },
    { sigil: '>*', label: 'Dynamic partial', description: 'Render a partial whose name comes from data.' },
    { sigil: '&', label: 'Unescaped variable', description: 'Render a value without escaping.' },
    { sigil: '!', label: 'Comment', description: 'Insert a template comment.' },
    { sigil: '=', label: 'Delimiter change', description: 'Change delimiters for following tags.' },
];

export const METADATA_COMPLETIONS: readonly MetadataCompletionData[] = [
    { name: 'index', label: '@index', description: 'Zero-based index of the current array item.' },
    { name: 'number', label: '@number', description: 'One-based position of the current array item.' },
    { name: 'first', label: '@first', description: 'True when the current item is first.' },
    { name: 'last', label: '@last', description: 'True when the current item is last.' },
    { name: 'length', label: '@length', description: 'Total number of items in the current array.' },
    { name: 'root', label: '@root', description: 'Access the root context at any nesting depth.' },
];

export function shouldOfferSigilCompletions(text: string, offset: number): boolean {
    const [openDelimiter] = activeDelimiters(text, offset);
    const openOffset = text.lastIndexOf(openDelimiter, offset - openDelimiter.length);
    if (openOffset === -1) return false;
    const previousOpenOffset = openOffset > 0
        ? text.lastIndexOf(openDelimiter, openOffset - 1)
        : -1;
    if (previousOpenOffset !== -1 && previousOpenOffset + openDelimiter.length > openOffset) {
        return false;
    }
    return /^\s*$/.test(text.slice(openOffset + openDelimiter.length, offset));
}

export function shouldOfferMetadataCompletions(text: string, offset: number): boolean {
    const [openDelimiter] = activeDelimiters(text, offset);
    const openOffset = text.lastIndexOf(openDelimiter, offset - openDelimiter.length);
    if (openOffset === -1) return false;
    const tagPrefix = text.slice(openOffset + openDelimiter.length, offset);
    return /^\s*(?:[#^*%~?/]\s*)?@[\w-]*$/.test(tagPrefix);
}

function activeDelimiters(text: string, offset: number): [string, string] {
    let delimiters: [string, string] = ['{{', '}}'];
    for (const tag of parse(text.slice(0, offset))) {
        if (tag.kind !== 'set-delimiter') continue;
        const parts = tag.name.trim().split(/\s+/);
        if (parts.length === 2) delimiters = [parts[0], parts[1]];
    }
    return delimiters;
}
import { METADATA_COMPLETIONS, SIGIL_COMPLETIONS } from './completionData';
import { parse } from './parser';

export interface HoverData {
    label: string;
    description: string;
    offset: number;
    length: number;
}

export function findHoverData(text: string, offset: number): HoverData | undefined {
    const tag = parse(text).find(candidate =>
        offset >= candidate.tagOffset && offset < candidate.tagOffset + candidate.tagLength);
    if (!tag) return undefined;

    const sigil = SIGIL_COMPLETIONS.find(completion => completion.sigil === tag.sigil);
    if (
        sigil &&
        offset >= tag.sigilOffset &&
        offset < tag.sigilOffset + tag.sigilLength
    ) {
        return {
            label: `${sigil.sigil} ${sigil.label}`,
            description: sigil.description,
            offset: tag.sigilOffset,
            length: tag.sigilLength,
        };
    }

    const metadata = METADATA_COMPLETIONS.find(completion =>
        tag.name === completion.label ||
        (completion.name === 'root' && tag.name.startsWith(`${completion.label}.`)));
    if (
        metadata &&
        offset >= tag.nameOffset &&
        offset < tag.nameOffset + metadata.label.length
    ) {
        return {
            label: metadata.label,
            description: metadata.description,
            offset: tag.nameOffset,
            length: metadata.label.length,
        };
    }

    return undefined;
}
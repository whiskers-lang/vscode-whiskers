import { SemanticTokenData } from './semanticTokenData';

export type ColorScheme = 'theme' | 'ember' | 'harbor' | 'paper' | 'signal';
export type ColorRole = SemanticTokenData['type'];

export type SchemeColors = Record<ColorRole, string>;

export const COLOR_SCHEMES: Record<Exclude<ColorScheme, 'theme'>, SchemeColors> = {
    ember: {
        mustacheDelimiter: '#8b8178',
        mustacheSigil: '#ff7a59',
        mustacheSection: '#efb45d',
        mustacheVariable: '#79c9c3',
        mustacheMetadata: '#a8c66c',
        mustachePartial: '#c49bd8',
        mustacheLambda: '#ee8eae',
        mustacheStringArgument: '#a8c66c',
        mustacheNumberArgument: '#d7a66f',
        parameter: '#f0ca75',
    },
    harbor: {
        mustacheDelimiter: '#718087',
        mustacheSigil: '#f06f68',
        mustacheSection: '#55b8b1',
        mustacheVariable: '#e2be6f',
        mustacheMetadata: '#8cc7ee',
        mustachePartial: '#b6a0df',
        mustacheLambda: '#ed94bd',
        mustacheStringArgument: '#9fcf8f',
        mustacheNumberArgument: '#e2a86f',
        parameter: '#df9f65',
    },
    paper: {
        mustacheDelimiter: '#8c8376',
        mustacheSigil: '#b33a32',
        mustacheSection: '#9a5a12',
        mustacheVariable: '#087b80',
        mustacheMetadata: '#416da3',
        mustachePartial: '#7752a0',
        mustacheLambda: '#ad3f71',
        mustacheStringArgument: '#477a35',
        mustacheNumberArgument: '#a45b22',
        parameter: '#8f4b16',
    },
    signal: {
        mustacheDelimiter: '#68716b',
        mustacheSigil: '#c12631',
        mustacheSection: '#006b62',
        mustacheVariable: '#9b5800',
        mustacheMetadata: '#1669a8',
        mustachePartial: '#6240a0',
        mustacheLambda: '#a72b68',
        mustacheStringArgument: '#287a3f',
        mustacheNumberArgument: '#a34f00',
        parameter: '#7c4d00',
    },
};

export function resolveColorScheme(
    configuredScheme: ColorScheme,
    isLightTheme: boolean,
): Exclude<ColorScheme, 'theme'> {
    if (configuredScheme !== 'theme') return configuredScheme;
    return isLightTheme ? 'paper' : 'ember';
}

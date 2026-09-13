import { SemanticTokenData } from './semanticTokenData';

export type ColorScheme = 'theme' | 'custom' | 'ember' | 'harbor' | 'paper' | 'signal';
export type ColorRole = SemanticTokenData['type'];
export type ColorPreset = Exclude<ColorScheme, 'theme' | 'custom'>;

export type SchemeColors = Record<ColorRole, string>;

export const COLOR_SCHEMES: Record<ColorPreset, SchemeColors> = {
    ember: {
        whiskersDelimiter: '#aaa097',
        whiskersComment: '#6f9f73',
        whiskersSigil: '#ff7a59',
        whiskersSection: '#efb45d',
        whiskersVariable: '#79c9c3',
        whiskersMetadata: '#a8c66c',
        whiskersPartial: '#c49bd8',
        whiskersLambda: '#ee8eae',
        whiskersStringArgument: '#a8c66c',
        whiskersNumberArgument: '#d7a66f',
        whiskersAlias: '#f0ca75',
    },
    harbor: {
        whiskersDelimiter: '#91a0a7',
        whiskersComment: '#76a56e',
        whiskersSigil: '#f06f68',
        whiskersSection: '#55b8b1',
        whiskersVariable: '#e2be6f',
        whiskersMetadata: '#8cc7ee',
        whiskersPartial: '#b6a0df',
        whiskersLambda: '#ed94bd',
        whiskersStringArgument: '#9fcf8f',
        whiskersNumberArgument: '#e2a86f',
        whiskersAlias: '#df9f65',
    },
    paper: {
        whiskersDelimiter: '#70685d',
        whiskersComment: '#5f753f',
        whiskersSigil: '#b33a32',
        whiskersSection: '#9a5a12',
        whiskersVariable: '#087b80',
        whiskersMetadata: '#416da3',
        whiskersPartial: '#7752a0',
        whiskersLambda: '#ad3f71',
        whiskersStringArgument: '#477a35',
        whiskersNumberArgument: '#a45b22',
        whiskersAlias: '#8f4b16',
    },
    signal: {
        whiskersDelimiter: '#505a54',
        whiskersComment: '#376f45',
        whiskersSigil: '#c12631',
        whiskersSection: '#006b62',
        whiskersVariable: '#9b5800',
        whiskersMetadata: '#1669a8',
        whiskersPartial: '#6240a0',
        whiskersLambda: '#a72b68',
        whiskersStringArgument: '#287a3f',
        whiskersNumberArgument: '#a34f00',
        whiskersAlias: '#7c4d00',
    },
};

export function resolveColorScheme(
    configuredScheme: ColorScheme,
    isLightTheme: boolean,
): ColorPreset | undefined {
    if (configuredScheme === 'custom') return undefined;
    if (configuredScheme !== 'theme') return configuredScheme;
    return isLightTheme ? 'paper' : 'ember';
}

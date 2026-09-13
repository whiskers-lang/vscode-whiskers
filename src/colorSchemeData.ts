import { SemanticTokenData } from './semanticTokenData';

export type ColorScheme =
    | 'theme'
    | 'custom'
    | 'ember'
    | 'harbor'
    | 'canopy'
    | 'afterglow'
    | 'paper'
    | 'signal'
    | 'solar'
    | 'cobalt'
    | 'jade'
    | 'violet'
    | 'rose';
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
    canopy: {
        whiskersDelimiter: '#9b9f8f',
        whiskersComment: '#78a46d',
        whiskersSigil: '#f0785f',
        whiskersSection: '#dfb65d',
        whiskersVariable: '#69c4a5',
        whiskersMetadata: '#87b9df',
        whiskersPartial: '#c49bd2',
        whiskersLambda: '#e88fa8',
        whiskersStringArgument: '#a1c76f',
        whiskersNumberArgument: '#dc9962',
        whiskersAlias: '#e1c674',
    },
    afterglow: {
        whiskersDelimiter: '#aaa8b2',
        whiskersComment: '#7f9f66',
        whiskersSigil: '#ff6188',
        whiskersSection: '#ffd866',
        whiskersVariable: '#78dce8',
        whiskersMetadata: '#a9dc76',
        whiskersPartial: '#ab9df2',
        whiskersLambda: '#fc9867',
        whiskersStringArgument: '#a9dc76',
        whiskersNumberArgument: '#fc9867',
        whiskersAlias: '#ffd866',
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
    solar: {
        whiskersDelimiter: '#657b83',
        whiskersComment: '#718c00',
        whiskersSigil: '#dc322f',
        whiskersSection: '#9c7600',
        whiskersVariable: '#1677ad',
        whiskersMetadata: '#16877d',
        whiskersPartial: '#6c71c4',
        whiskersLambda: '#c52f78',
        whiskersStringArgument: '#718c00',
        whiskersNumberArgument: '#cb4b16',
        whiskersAlias: '#9c7600',
    },
    cobalt: {
        whiskersDelimiter: '#5797c2',
        whiskersComment: '#6f9f73',
        whiskersSigil: '#4e91c4',
        whiskersSection: '#3f82bd',
        whiskersVariable: '#4a89c2',
        whiskersMetadata: '#3e8da8',
        whiskersPartial: '#608dc4',
        whiskersLambda: '#4687b4',
        whiskersStringArgument: '#5685aa',
        whiskersNumberArgument: '#6293b6',
        whiskersAlias: '#51a0c1',
    },
    jade: {
        whiskersDelimiter: '#679b83',
        whiskersComment: '#577b68',
        whiskersSigil: '#5f9878',
        whiskersSection: '#4f8a70',
        whiskersVariable: '#5b9477',
        whiskersMetadata: '#548d73',
        whiskersPartial: '#6a9d82',
        whiskersLambda: '#56876e',
        whiskersStringArgument: '#648f77',
        whiskersNumberArgument: '#709985',
        whiskersAlias: '#5b9a7c',
    },
    violet: {
        whiskersDelimiter: '#8c83b3',
        whiskersComment: '#6f9f73',
        whiskersSigil: '#9185bd',
        whiskersSection: '#8275b1',
        whiskersVariable: '#897cbc',
        whiskersMetadata: '#796da8',
        whiskersPartial: '#9589c2',
        whiskersLambda: '#8175ae',
        whiskersStringArgument: '#8c80b5',
        whiskersNumberArgument: '#9a8fc0',
        whiskersAlias: '#8678b8',
    },
    rose: {
        whiskersDelimiter: '#b77e8a',
        whiskersComment: '#6f9f73',
        whiskersSigil: '#c17b8d',
        whiskersSection: '#b66f84',
        whiskersVariable: '#bd778a',
        whiskersMetadata: '#a96b7f',
        whiskersPartial: '#c18495',
        whiskersLambda: '#ad7181',
        whiskersStringArgument: '#b87b8b',
        whiskersNumberArgument: '#c18b98',
        whiskersAlias: '#ba7488',
    },
};

export const PRESET_PLAINTEXT_COLORS: Partial<Record<ColorPreset, string>> = {
    cobalt: '#d98b5f',
    jade: '#c58b70',
    violet: '#c7a568',
    rose: '#86a8ad',
};

export function resolveColorScheme(
    configuredScheme: ColorScheme,
    isLightTheme: boolean,
): ColorPreset | undefined {
    if (configuredScheme === 'custom') return undefined;
    if (configuredScheme !== 'theme') return configuredScheme;
    return isLightTheme ? 'paper' : 'ember';
}

export function resolvePresetPlaintextColor(
    configuredScheme: ColorScheme,
    isLightTheme: boolean,
): string | undefined {
    const preset = resolveColorScheme(configuredScheme, isLightTheme);
    return preset ? PRESET_PLAINTEXT_COLORS[preset] : undefined;
}

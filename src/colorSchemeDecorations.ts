import * as vscode from 'vscode';
import {
    COLOR_SCHEMES,
    ColorRole,
    ColorScheme,
    resolveColorScheme,
} from './colorSchemeData';
import { collectSemanticTokens, TOKEN_TYPES } from './semanticTokenData';

const PRESETS = Object.keys(COLOR_SCHEMES) as Exclude<ColorScheme, 'theme'>[];
export class WhiskersColorSchemeDecorations implements vscode.Disposable {
    private readonly decorations = new Map<string, vscode.TextEditorDecorationType>();

    constructor() {
        for (const preset of PRESETS) {
            for (const role of TOKEN_TYPES as ColorRole[]) {
                const colors = COLOR_SCHEMES[preset];
                this.decorations.set(this.key(preset, role), vscode.window.createTextEditorDecorationType({
                    color: colors[role],
                }));
            }
        }
    }

    update(editor: vscode.TextEditor): void {
        for (const decoration of this.decorations.values()) {
            editor.setDecorations(decoration, []);
        }

        const configuredScheme = vscode.workspace
            .getConfiguration('whiskers', editor.document.uri)
            .get<ColorScheme>('colorScheme', 'theme');
        const themeKind = vscode.window.activeColorTheme.kind;
        const isLightTheme = themeKind === vscode.ColorThemeKind.Light ||
            themeKind === vscode.ColorThemeKind.HighContrastLight;
        const preset = resolveColorScheme(configuredScheme, isLightTheme);
        if (!PRESETS.includes(preset)) return;

        const ranges = new Map<ColorRole, vscode.Range[]>();
        for (const token of collectSemanticTokens(editor.document.getText())) {
            const range = new vscode.Range(
                editor.document.positionAt(token.offset),
                editor.document.positionAt(token.offset + token.length),
            );
            const roleRanges = ranges.get(token.type) ?? [];
            roleRanges.push(range);
            ranges.set(token.type, roleRanges);
        }

        for (const [role, roleRanges] of ranges) {
            const decoration = this.decorations.get(this.key(preset, role));
            if (decoration) editor.setDecorations(decoration, roleRanges);
        }
    }

    dispose(): void {
        for (const decoration of this.decorations.values()) decoration.dispose();
    }

    private key(preset: ColorScheme, role: ColorRole): string {
        return `${preset}:${role}`;
    }
}

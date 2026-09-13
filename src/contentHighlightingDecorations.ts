import * as vscode from 'vscode';
import {
    collectContentHighlightingRanges,
    normalizeOpacity,
    normalizePlaintextColor,
} from './contentHighlightingData';

export type ContentHighlighting = 'default' | 'plaintext';

export class WhiskersContentHighlightingDecorations implements vscode.Disposable {
    private readonly plaintextDecorations = new Map<string, vscode.TextEditorDecorationType>();
    private readonly templateDecorations = new Map<number, vscode.TextEditorDecorationType>();

    update(editor: vscode.TextEditor): void {
        this.clear(editor, this.plaintextDecorations);
        this.clear(editor, this.templateDecorations);

        const configuration = vscode.workspace.getConfiguration('whiskers', editor.document.uri);
        const text = editor.document.getText();
        const ranges = collectContentHighlightingRanges(text);
        const mode = configuration
            .get<ContentHighlighting>('contentHighlighting', 'default');
        if (mode === 'plaintext') {
            const opacity = normalizeOpacity(configuration.get<number>('plaintextOpacity', 0.8));
            const color = normalizePlaintextColor(
                configuration.get<string | null>('plaintextColor'),
            );
            editor.setDecorations(
                this.plaintextDecorationFor(opacity, color),
                this.toRanges(editor.document, ranges.plaintext),
            );
        }

        const templateOpacity = normalizeOpacity(configuration.get<number>('templateOpacity', 1));
        if (templateOpacity < 1) {
            editor.setDecorations(
                this.templateDecorationFor(templateOpacity),
                this.toRanges(editor.document, ranges.template),
            );
        }
    }

    dispose(): void {
        for (const decoration of this.plaintextDecorations.values()) decoration.dispose();
        for (const decoration of this.templateDecorations.values()) decoration.dispose();
    }

    private plaintextDecorationFor(
        opacity: number,
        color: string | undefined,
    ): vscode.TextEditorDecorationType {
        const key = `${color ?? 'editor.foreground'}:${opacity}`;
        const existing = this.plaintextDecorations.get(key);
        if (existing) return existing;

        const decoration = vscode.window.createTextEditorDecorationType({
            color: color ?? new vscode.ThemeColor('editor.foreground'),
            opacity: opacity.toString(),
        });
        this.plaintextDecorations.set(key, decoration);
        return decoration;
    }

    private templateDecorationFor(opacity: number): vscode.TextEditorDecorationType {
        const existing = this.templateDecorations.get(opacity);
        if (existing) return existing;

        const decoration = vscode.window.createTextEditorDecorationType({
            opacity: opacity.toString(),
        });
        this.templateDecorations.set(opacity, decoration);
        return decoration;
    }

    private clear(
        editor: vscode.TextEditor,
        decorations: Map<unknown, vscode.TextEditorDecorationType>,
    ): void {
        for (const decoration of decorations.values()) editor.setDecorations(decoration, []);
    }

    private toRanges(document: vscode.TextDocument, ranges: { offset: number; length: number }[]): vscode.Range[] {
        return ranges.map(range => new vscode.Range(
            document.positionAt(range.offset),
            document.positionAt(range.offset + range.length),
        ));
    }
}

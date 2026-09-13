import * as vscode from 'vscode';
import { collectPlaintextContentRanges } from './contentHighlightingData';

export type ContentHighlighting = 'default' | 'plaintext';

export class WhiskersContentHighlightingDecorations implements vscode.Disposable {
    private readonly decoration = vscode.window.createTextEditorDecorationType({
        color: new vscode.ThemeColor('editor.foreground'),
    });

    update(editor: vscode.TextEditor): void {
        const mode = vscode.workspace
            .getConfiguration('whiskers', editor.document.uri)
            .get<ContentHighlighting>('contentHighlighting', 'default');
        if (mode !== 'plaintext') {
            editor.setDecorations(this.decoration, []);
            return;
        }

        const ranges = collectPlaintextContentRanges(editor.document.getText()).map(range =>
            new vscode.Range(
                editor.document.positionAt(range.offset),
                editor.document.positionAt(range.offset + range.length),
            ));
        editor.setDecorations(this.decoration, ranges);
    }

    dispose(): void {
        this.decoration.dispose();
    }
}

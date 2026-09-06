import * as vscode from 'vscode';
import { collectSemanticTokens, TOKEN_MODS, TOKEN_TYPES } from './semanticTokenData';

export const LEGEND = new vscode.SemanticTokensLegend(TOKEN_TYPES, TOKEN_MODS);

export class WhiskersSemanticTokensProvider
    implements vscode.DocumentSemanticTokensProvider
{
    provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens {
        const text = document.getText();
        const pending = collectSemanticTokens(text);

        const builder = new vscode.SemanticTokensBuilder(LEGEND);
        for (const p of pending) {
            const start = document.positionAt(p.offset);
            const end   = document.positionAt(p.offset + p.length);
            if (start.line !== end.line) continue;
            builder.push(start.line, start.character, p.length, TOKEN_TYPES.indexOf(p.type), p.mods);
        }
        return builder.build();
    }
}

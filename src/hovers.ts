import * as vscode from 'vscode';
import { findHoverData } from './hoverData';

export class WhiskersHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.Hover | undefined {
        const data = findHoverData(document.getText(), document.offsetAt(position));
        if (!data) return undefined;

        const contents = new vscode.MarkdownString();
        contents.appendMarkdown(`\`${data.label}\`\n\n${data.description}`);
        const range = new vscode.Range(
            document.positionAt(data.offset),
            document.positionAt(data.offset + data.length),
        );
        return new vscode.Hover(contents, range);
    }
}
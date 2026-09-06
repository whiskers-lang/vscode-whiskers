import * as vscode from 'vscode';
import { findAliasRenameTarget, isValidAliasName, TextRange } from './aliasTargets';

export class WhiskersRenameProvider implements vscode.RenameProvider {
    prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.Range | { range: vscode.Range; placeholder: string } | undefined {
        const offset = document.offsetAt(position);
        const target = findAliasRenameTarget(document.getText(), offset);
        if (!target) return undefined;

        const selected = [target.declaration, ...target.references]
            .find(range => contains(range, offset));
        if (!selected) return undefined;
        return { range: toRange(document, selected), placeholder: target.name };
    }

    provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
    ): vscode.WorkspaceEdit | undefined {
        if (!isValidAliasName(newName)) {
            throw new Error('Alias names must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens.');
        }

        const target = findAliasRenameTarget(document.getText(), document.offsetAt(position));
        if (!target) return undefined;

        const edit = new vscode.WorkspaceEdit();
        for (const range of [target.declaration, ...target.references]) {
            edit.replace(document.uri, toRange(document, range), newName);
        }
        return edit;
    }
}

function contains(range: TextRange, offset: number): boolean {
    return offset >= range.offset && offset <= range.offset + range.length;
}

function toRange(document: vscode.TextDocument, range: TextRange): vscode.Range {
    return new vscode.Range(
        document.positionAt(range.offset),
        document.positionAt(range.offset + range.length),
    );
}
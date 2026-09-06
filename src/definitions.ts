import * as vscode from 'vscode';
import * as path from 'path';
import { findDefinitionTarget, resolveTemplateRoots } from './definitionTargets';
import { findAliasDeclaration } from './aliasTargets';

export class WhiskersDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.ProviderResult<vscode.Definition> {
        const text = document.getText();
        const offset = document.offsetAt(position);
        const alias = findAliasDeclaration(text, offset);
        if (alias) {
            const start = document.positionAt(alias.offset);
            const end = document.positionAt(alias.offset + alias.length);
            return new vscode.Location(document.uri, new vscode.Range(start, end));
        }

        const workspaceDirectory = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;
        const baseDirectory = workspaceDirectory ?? path.dirname(document.uri.fsPath);
        const configuredRoots = vscode.workspace
            .getConfiguration('whiskers', document.uri)
            .get<string[]>('templateRoots', []);
        const templateRoots = resolveTemplateRoots(configuredRoots, baseDirectory);
        const target = findDefinitionTarget(text, offset, document.uri.fsPath, templateRoots);

        if (target?.kind === 'range') {
            const start = document.positionAt(target.offset);
            const end = document.positionAt(target.offset + target.length);
            return new vscode.Location(document.uri, new vscode.Range(start, end));
        }

        if (target?.kind === 'file') {
            return new vscode.Location(vscode.Uri.file(target.path), new vscode.Position(0, 0));
        }

        return null;
    }
}

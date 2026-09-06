import * as vscode from 'vscode';
import { collectDiagnostics } from './diagnosticData';

export class WhiskersDiagnostics implements vscode.Disposable {
    private readonly collection = vscode.languages.createDiagnosticCollection('whiskers');
    private readonly languages: Set<string>;

    constructor(languages: readonly string[]) {
        this.languages = new Set(languages);
    }

    update(document: vscode.TextDocument): void {
        if (!this.languages.has(document.languageId)) {
            this.collection.delete(document.uri);
            return;
        }

        const diagnostics = collectDiagnostics(document.getText()).map(data => {
            const range = new vscode.Range(
                document.positionAt(data.offset),
                document.positionAt(data.offset + data.length),
            );
            const severity = data.severity === 'error'
                ? vscode.DiagnosticSeverity.Error
                : vscode.DiagnosticSeverity.Warning;
            const diagnostic = new vscode.Diagnostic(range, data.message, severity);
            diagnostic.code = data.code;
            diagnostic.source = 'Whiskers';
            return diagnostic;
        });
        this.collection.set(document.uri, diagnostics);
    }

    delete(document: vscode.TextDocument): void {
        this.collection.delete(document.uri);
    }

    dispose(): void {
        this.collection.dispose();
    }
}
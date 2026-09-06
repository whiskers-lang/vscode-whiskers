import * as vscode from 'vscode';
import { collectDocumentSymbols, SymbolData, SymbolDataKind } from './symbolData';

export class WhiskersSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
        return collectDocumentSymbols(document.getText())
            .map(symbol => toDocumentSymbol(document, symbol));
    }
}

function toDocumentSymbol(
    document: vscode.TextDocument,
    data: SymbolData,
): vscode.DocumentSymbol {
    const symbol = new vscode.DocumentSymbol(
        data.name,
        data.detail,
        symbolKind(data.kind),
        new vscode.Range(
            document.positionAt(data.offset),
            document.positionAt(data.offset + data.length),
        ),
        new vscode.Range(
            document.positionAt(data.selectionOffset),
            document.positionAt(data.selectionOffset + data.selectionLength),
        ),
    );
    symbol.children = data.children.map(child => toDocumentSymbol(document, child));
    return symbol;
}

function symbolKind(kind: SymbolDataKind): vscode.SymbolKind {
    switch (kind) {
        case 'array': return vscode.SymbolKind.Array;
        case 'block': return vscode.SymbolKind.Property;
        case 'parent': return vscode.SymbolKind.Class;
        case 'partial': return vscode.SymbolKind.File;
        case 'section': return vscode.SymbolKind.Module;
    }
}

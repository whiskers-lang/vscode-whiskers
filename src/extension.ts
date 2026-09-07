import * as vscode from 'vscode';
import { formatDocument, formatRange } from './formatter';
import { WhiskersFoldingProvider } from './folding';
import { WhiskersSymbolProvider } from './symbols';
import { parse } from './parser';
import { LEGEND, WhiskersSemanticTokensProvider } from './semanticTokens';
import { WhiskersDefinitionProvider } from './definitions';
import { WhiskersDiagnostics } from './diagnostics';
import { WhiskersCompletionProvider } from './completions';
import { WhiskersHoverProvider } from './hovers';
import { WhiskersRenameProvider } from './rename';
import { WhiskersColorSchemeDecorations } from './colorSchemeDecorations';

const LANGUAGES = ['mustache', 'whiskers'];
const SELECTOR: vscode.DocumentSelector = LANGUAGES.map(language => ({ language }));

// De-emphasize default-delimiter tags while custom delimiters are active.
const INACTIVE_DECOR = vscode.window.createTextEditorDecorationType({
    color: new vscode.ThemeColor('editor.foreground'),
});


function updateInactiveDecorations(editor: vscode.TextEditor): void {
    if (!LANGUAGES.includes(editor.document.languageId)) return;
    const text = editor.document.getText();
    const tags = parse(text);

    const inactiveIntervals: [number, number][] = [];
    let delimState = '{{';
    let prevPos = 0;
    for (const tag of tags) {
        if (tag.kind === 'set-delimiter') {
            if (delimState !== '{{') inactiveIntervals.push([prevPos, tag.tagOffset]);
            const parts = tag.name.trim().split(/\s+/);
            if (parts.length === 2) delimState = parts[0];
            prevPos = tag.tagOffset + tag.tagLength;
        }
    }
    if (delimState !== '{{') inactiveIntervals.push([prevPos, text.length]);

    const inInactive = (pos: number) => inactiveIntervals.some(([s, e]) => pos >= s && pos < e);

    const ranges: vscode.Range[] = [];
    const re = /\{\{\{?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (!inInactive(m.index)) continue;
        const close = m[0].length === 3 ? '}}}' : '}}';
        const closeIdx = text.indexOf(close, m.index + m[0].length);
        if (closeIdx === -1) continue;
        ranges.push(new vscode.Range(
            editor.document.positionAt(m.index),
            editor.document.positionAt(closeIdx + close.length),
        ));
        re.lastIndex = closeIdx + close.length;
    }

    editor.setDecorations(INACTIVE_DECOR, ranges);
}

class TemplateFormatter
    implements
        vscode.DocumentFormattingEditProvider,
        vscode.DocumentRangeFormattingEditProvider
{
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
    ): vscode.TextEdit[] {
        const text = document.getText();
        const formatted = formatDocument(text, options);
        if (formatted === text) {
            return [];
        }
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length),
        );
        return [vscode.TextEdit.replace(fullRange, formatted)];
    }

    provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
    ): vscode.TextEdit[] {
        const rangeText = document.getText(range);
        const formatted = formatRange(rangeText, range, options, document);
        if (formatted === rangeText) {
            return [];
        }
        return [vscode.TextEdit.replace(range, formatted)];
    }
}

export function activate(context: vscode.ExtensionContext): void {
    const formatter = new TemplateFormatter();
    const diagnostics = new WhiskersDiagnostics(LANGUAGES);
    const colorSchemes = new WhiskersColorSchemeDecorations();
    const updateDecorations = (editor: vscode.TextEditor): void => {
        if (!LANGUAGES.includes(editor.document.languageId)) return;
        colorSchemes.update(editor);
        updateInactiveDecorations(editor);
    };
    for (const language of LANGUAGES) {
        context.subscriptions.push(
            vscode.languages.registerDocumentFormattingEditProvider(
                { language },
                formatter,
            ),
            vscode.languages.registerDocumentRangeFormattingEditProvider(
                { language },
                formatter,
            ),
        );
    }

    vscode.window.visibleTextEditors.forEach(updateDecorations);
    vscode.workspace.textDocuments.forEach(document => diagnostics.update(document));
    context.subscriptions.push(
        INACTIVE_DECOR,
        colorSchemes,
        diagnostics,
        vscode.window.onDidChangeVisibleTextEditors(editors => {
            editors.forEach(updateDecorations);
        }),
        vscode.workspace.onDidOpenTextDocument(doc => {
            const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
            if (editor) updateDecorations(editor);
        }),
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
            if (editor) updateDecorations(editor);
        }),
        vscode.workspace.onDidChangeConfiguration(event => {
            if (!event.affectsConfiguration('whiskers.colorScheme')) return;
            vscode.window.visibleTextEditors.forEach(updateDecorations);
        }),
        vscode.window.onDidChangeActiveColorTheme(() => {
            vscode.window.visibleTextEditors.forEach(updateDecorations);
        }),
        vscode.workspace.onDidOpenTextDocument(document => diagnostics.update(document)),
        vscode.workspace.onDidChangeTextDocument(event => diagnostics.update(event.document)),
        vscode.workspace.onDidCloseTextDocument(document => diagnostics.delete(document)),
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            SELECTOR,
            new WhiskersCompletionProvider(),
            '{', '%', '[', '(', '<', '@', '.',
        ),
        vscode.languages.registerHoverProvider(
            SELECTOR,
            new WhiskersHoverProvider(),
        ),
        vscode.languages.registerRenameProvider(
            { language: 'whiskers' },
            new WhiskersRenameProvider(),
        ),
        vscode.languages.registerDocumentSemanticTokensProvider(
            SELECTOR,
            new WhiskersSemanticTokensProvider(),
            LEGEND,
        ),
        vscode.languages.registerDefinitionProvider(
            SELECTOR,
            new WhiskersDefinitionProvider(),
        ),
        vscode.languages.registerFoldingRangeProvider(
            SELECTOR,
            new WhiskersFoldingProvider(),
        ),
        vscode.languages.registerDocumentSymbolProvider(
            SELECTOR,
            new WhiskersSymbolProvider(),
        ),
    );
}

export function deactivate(): void {}

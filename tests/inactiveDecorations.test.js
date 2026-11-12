const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const template = [
    '{{active}}',
    '{{=<% %>=}}',
    'value: ${{ parameters.name }}',
    '<%name%>',
    '<%={{ }}=%>',
    '{{activeAgain}}',
].join('\n');

function activateEditor(configuration, languageId = 'mustache') {
    let configurationChanged;
    let inactiveRanges = [];
    const disposable = { dispose() {} };
    const editor = {
        document: {
            languageId,
            uri: {},
            getText: () => template,
            positionAt: offset => offset,
        },
        setDecorations: (_decoration, ranges) => {
            inactiveRanges = Array.from(ranges, range => template.slice(range.start, range.end));
        },
    };
    class Provider {
        update() {}
        dispose() {}
    }
    const providers = Object.fromEntries([
        'WhiskersFoldingProvider',
        'WhiskersSymbolProvider',
        'WhiskersSemanticTokensProvider',
        'WhiskersDefinitionProvider',
        'WhiskersDiagnostics',
        'WhiskersCompletionProvider',
        'WhiskersHoverProvider',
        'WhiskersRenameProvider',
        'WhiskersColorSchemeDecorations',
        'WhiskersContentHighlightingDecorations',
    ].map(name => [name, Provider]));
    const vscode = {
        ThemeColor: class {
            constructor(id) { this.id = id; }
        },
        Range: class {
            constructor(start, end) {
                this.start = start;
                this.end = end;
            }
        },
        window: {
            createTextEditorDecorationType: () => disposable,
            visibleTextEditors: [editor],
            onDidChangeVisibleTextEditors: () => disposable,
            onDidChangeActiveColorTheme: () => disposable,
        },
        workspace: {
            textDocuments: [],
            getConfiguration: () => ({
                get: (name, fallback) => configuration[name] ?? fallback,
            }),
            onDidOpenTextDocument: () => disposable,
            onDidChangeTextDocument: () => disposable,
            onDidCloseTextDocument: () => disposable,
            onDidChangeConfiguration: callback => {
                configurationChanged = callback;
                return disposable;
            },
        },
        commands: { registerCommand: () => disposable },
        languages: Object.fromEntries([
            'registerDocumentFormattingEditProvider',
            'registerDocumentRangeFormattingEditProvider',
            'registerCompletionItemProvider',
            'registerHoverProvider',
            'registerRenameProvider',
            'registerDocumentSemanticTokensProvider',
            'registerDefinitionProvider',
            'registerFoldingRangeProvider',
            'registerDocumentSymbolProvider',
        ].map(name => [name, () => disposable])),
    };
    const exports = {};
    vm.runInNewContext(fs.readFileSync(require.resolve('../out/extension'), 'utf8'), {
        exports,
        require: name => {
            if (name === 'vscode') return vscode;
            if (name === './parser') return require('../out/parser');
            return providers;
        },
    });
    exports.activate({ subscriptions: [] });

    return {
        ranges: () => inactiveRanges,
        setMode: mode => {
            configuration.contentHighlighting = mode;
            configurationChanged({
                affectsConfiguration: name => name === 'whiskers.contentHighlighting',
            });
        },
    };
}

for (const language of ['mustache', 'whiskers']) {
    test(`default mode neutralizes only inactive delimiters in ${language}`, () => {
        const editor = activateEditor({ contentHighlighting: 'default' }, language);
        assert.deepEqual(editor.ranges(), ['{{ parameters.name }}']);
    });

    test(`plaintext mode does not override generated-content color in ${language}`, () => {
        for (const configuration of [
            { colorScheme: 'cobalt' },
            { colorScheme: 'custom', plaintextColor: '#d19a66', plaintextOpacity: 0.6 },
            { colorScheme: 'theme' },
        ]) {
            const editor = activateEditor({ ...configuration, contentHighlighting: 'plaintext' }, language);
            assert.deepEqual(editor.ranges(), []);
        }
    });
}

test('switching highlighting modes clears and restores inactive decorations', () => {
    const editor = activateEditor({ contentHighlighting: 'default' });
    assert.deepEqual(editor.ranges(), ['{{ parameters.name }}']);
    editor.setMode('plaintext');
    assert.deepEqual(editor.ranges(), []);
    editor.setMode('default');
    assert.deepEqual(editor.ranges(), ['{{ parameters.name }}']);
});

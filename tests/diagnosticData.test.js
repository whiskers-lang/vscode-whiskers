const assert = require('node:assert/strict');
const test = require('node:test');
const { collectDiagnostics } = require('../out/diagnosticData');

test('reports an unmatched closing tag', () => {
    assertDiagnostic('{{/items}}', 'unmatched-close', 'items');
});

test('reports an unclosed section', () => {
    assertDiagnostic('{{#items}}', 'unclosed-section', 'items');
});

test('reports a mismatched section name', () => {
    const diagnostics = collectDiagnostics('{{#items}}{{/users}}');
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].code, 'mismatched-section');
    assert.equal(sourceText('{{#items}}{{/users}}', diagnostics[0]), 'users');
});

test('reports malformed delimiter changes', () => {
    for (const template of ['{{=<% %>}}', '{{=<%>=}}', '{{=<% %>=']) {
        assertDiagnostic(template, 'malformed-delimiter-change', template);
    }
});

test('reports an alias referenced outside its scope', () => {
    const template = '{{#items:item}}{{item.name}}{{/items}}{{item.name}}';
    const diagnostics = collectDiagnostics(template);
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].code, 'alias-out-of-scope');
    assert.equal(diagnostics[0].severity, 'warning');
    assert.equal(sourceText(template, diagnostics[0]), 'item');
    assert.equal(diagnostics[0].offset, template.lastIndexOf('item.name'));
});

test('reports alias-qualified metadata referenced outside its scope', () => {
    const template = '{{#rows:row}}{{@row.index}}{{/rows}}{{@row.index}}';
    const diagnostics = collectDiagnostics(template);
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].code, 'alias-out-of-scope');
    assert.equal(diagnostics[0].severity, 'warning');
    assert.equal(sourceText(template, diagnostics[0]), 'row');
    assert.equal(diagnostics[0].offset, template.lastIndexOf('@row.index') + 1);
});

test('reports an alias duplicated in a nested section', () => {
    const template = '{{#outer:scope}}{{#inner:scope}}{{/inner}}{{/outer}}';
    const diagnostics = collectDiagnostics(template);
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].code, 'duplicate-alias');
    assert.equal(diagnostics[0].severity, 'error');
    assert.equal(sourceText(template, diagnostics[0]), 'scope');
    assert.equal(diagnostics[0].offset, template.lastIndexOf('scope'));
});

test('reports an alias that shadows a metadata name', () => {
    for (const name of ['index', 'number', 'first', 'last', 'length', 'root']) {
        const template = `{{#items:${name}}}{{/items}}`;
        const diagnostics = collectDiagnostics(template);
        assert.equal(diagnostics.length, 1);
        assert.equal(diagnostics[0].code, 'duplicate-alias');
        assert.equal(diagnostics[0].severity, 'error');
        assert.equal(diagnostics[0].message, `Alias "${name}" conflicts with metadata "@${name}".`);
        assert.equal(sourceText(template, diagnostics[0]), name);
    }
});

test('allows an alias to be reused after its section closes', () => {
    const template = '{{#first:scope}}{{/first}}{{#second:scope}}{{/second}}';
    assert.deepEqual(collectDiagnostics(template), []);
});

test('does not report valid nested sections, delimiters, or aliases', () => {
    const template = '{{=[[ ]]=}}[[#items:item]][[item]][[/items]][[={{ }}=]]{{name}}';
    assert.deepEqual(collectDiagnostics(template), []);
});

function assertDiagnostic(template, code, expectedSource) {
    const diagnostics = collectDiagnostics(template);
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].code, code);
    assert.equal(sourceText(template, diagnostics[0]), expectedSource);
}

function sourceText(template, diagnostic) {
    return template.slice(diagnostic.offset, diagnostic.offset + diagnostic.length);
}
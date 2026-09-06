const assert = require('node:assert/strict');
const test = require('node:test');
const { collectDocumentSymbols } = require('../out/symbolData');

test('builds nested sections in source order', () => {
    const symbols = collectDocumentSymbols('{{#outer}}{{#inner}}{{/inner}}{{/outer}}');
    assert.equal(symbols.length, 1);
    assert.equal(symbols[0].name, '#outer');
    assert.equal(symbols[0].children[0].name, '#inner');
    assert.equal(symbols[0].detail, '');
});

test('includes static and dynamic partials in their containing section', () => {
    const symbols = collectDocumentSymbols('{{#page}}{{> header}}{{>* layout}}{{/page}}{{> footer}}');
    assert.deepEqual(symbols.map(symbol => symbol.name), ['#page', '> footer']);
    assert.deepEqual(symbols[0].children.map(symbol => [symbol.name, symbol.detail]), [
        ['> header', 'Partial'],
        ['>* layout', 'Dynamic partial'],
    ]);
});

test('keeps unclosed sections visible through the end of the document', () => {
    const template = '{{#outer}}{{> card}}';
    const symbol = collectDocumentSymbols(template)[0];
    assert.equal(symbol.detail, 'Unclosed section');
    assert.equal(symbol.offset + symbol.length, template.length);
    assert.equal(symbol.children[0].name, '> card');
});

test('annotates mismatched nesting without matching an outer frame', () => {
    const symbols = collectDocumentSymbols('{{#outer}}{{#inner}}{{/outer}}');
    const outer = symbols[0];
    const inner = outer.children[0];
    assert.equal(outer.detail, 'Unclosed section');
    assert.equal(inner.detail, 'Mismatched closing tag: expected /inner, found /outer');
});

test('includes unmatched closing tags as malformed symbols', () => {
    const symbol = collectDocumentSymbols('{{/missing}}')[0];
    assert.equal(symbol.name, '/missing');
    assert.equal(symbol.detail, 'Unmatched closing tag');
});

test('supports sections and partials with custom delimiters', () => {
    const symbols = collectDocumentSymbols('{{=[[ ]]=}}[[< layout]][[> header]][[/layout]]');
    assert.equal(symbols[0].name, '<layout');
    assert.equal(symbols[0].kind, 'parent');
    assert.equal(symbols[0].children[0].name, '> header');
});
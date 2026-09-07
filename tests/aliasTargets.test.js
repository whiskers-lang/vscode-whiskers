const assert = require('node:assert/strict');
const test = require('node:test');
const {
    findAliasDeclaration,
    findAliasRenameTarget,
    isValidAliasName,
} = require('../out/aliasTargets');

test('renames an alias declaration and its scoped keypath references', () => {
    const template = '{{#items:item}}{{item.name}}{{.item.value}}{{#item.children}}{{/item.children}}{{/items}}';
    const target = findAliasRenameTarget(template, template.indexOf(':item') + 2);

    assert.equal(target.name, 'item');
    assert.equal(sourceText(template, target.declaration), 'item');
    assert.deepEqual(target.references.map(range => sourceText(template, range)), [
        'item', 'item', 'item', 'item',
    ]);
});

test('finds the same rename target from a reference', () => {
    const template = '{{#items:item}}{{item.name}}{{/items}}';
    const fromDeclaration = findAliasRenameTarget(template, template.indexOf(':item') + 1);
    const fromReference = findAliasRenameTarget(template, template.indexOf('item.name') + 1);
    assert.deepEqual(fromReference, fromDeclaration);
});

test('finds aliases when the caret is immediately after the token', () => {
    const template = '{{#items:u}}{{u.name}}{{/items}}';
    const declarationEnd = template.indexOf(':u') + 2;
    const referenceEnd = template.indexOf('u.name') + 1;

    assert.equal(findAliasRenameTarget(template, declarationEnd).name, 'u');
    assert.equal(findAliasRenameTarget(template, referenceEnd).name, 'u');
});

test('keeps nested aliases with the same name in separate rename scopes', () => {
    const template = [
        '{{#outer:item}}',
        '{{item.before}}',
        '{{#inner:item}}{{item.inner}}{{/inner}}',
        '{{item.after}}',
        '{{/outer}}',
    ].join('');
    const declarations = [...template.matchAll(/:item/g)].map(match => match.index + 1);
    const outer = findAliasRenameTarget(template, declarations[0]);
    const inner = findAliasRenameTarget(template, declarations[1]);

    assert.equal(outer.references.length, 2);
    assert.equal(inner.references.length, 1);
    assert.ok(outer.references.every(range => !inner.references.some(innerRange => innerRange.offset === range.offset)));
});

test('does not rename an out-of-scope same-named variable', () => {
    const template = '{{#items:item}}{{item}}{{/items}}{{item}}';
    const target = findAliasRenameTarget(template, template.indexOf(':item') + 1);
    assert.equal(target.references.length, 1);
    assert.equal(findAliasRenameTarget(template, template.lastIndexOf('item')), undefined);
});

test('renames aliases with custom delimiters', () => {
    const template = '{{=[[ ]]=}}[[#items:item]][[item.name]][[/items]]';
    const target = findAliasRenameTarget(template, template.indexOf(':item') + 1);

    assert.equal(sourceText(template, target.declaration), 'item');
    assert.deepEqual(target.references.map(range => sourceText(template, range)), ['item']);
});

test('resolves a dotted alias reference to its nearest declaration', () => {
    const template = '{{#items:item}}{{item.name}}{{/items}}';
    const declaration = findAliasDeclaration(template, template.indexOf('item.name') + 1);
    assert.equal(sourceText(template, declaration), 'item');
    assert.equal(declaration.offset, template.indexOf(':item') + 1);
});

test('resolves and renames aliases used with qualified metadata', () => {
    const template = '{{#rows:row}}{{@row.index}}{{/rows}}';
    const declarationOffset = template.indexOf(':row') + 1;
    const referenceOffset = template.indexOf('@row.index') + 2;
    const fromDeclaration = findAliasRenameTarget(template, declarationOffset);
    const fromReference = findAliasRenameTarget(template, referenceOffset);

    assert.deepEqual(fromReference, fromDeclaration);
    assert.deepEqual(fromDeclaration.references.map(range => sourceText(template, range)), ['row']);

    const declaration = findAliasDeclaration(template, referenceOffset);
    assert.equal(sourceText(template, declaration), 'row');
    assert.equal(declaration.offset, declarationOffset);
});

test('validates alias names', () => {
    for (const name of ['item', 'line_item', 'line-item', '_item']) {
        assert.equal(isValidAliasName(name), true);
    }
    for (const name of ['', '1item', '@item', 'item.name', 'item name']) {
        assert.equal(isValidAliasName(name), false);
    }
});

function sourceText(template, range) {
    return template.slice(range.offset, range.offset + range.length);
}
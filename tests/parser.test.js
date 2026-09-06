const assert = require('node:assert/strict');
const test = require('node:test');
const { parse } = require('../out/parser');

const cases = [
    { template: '{{name}}', kind: 'variable', name: 'name', sigil: '' },
    { template: '{{{html}}}', kind: 'triple', name: 'html', sigil: '{{{' },
    { template: '{{& html}}', kind: 'unescaped', name: 'html', sigil: '&' },
    { template: '{{@index}}', kind: 'variable-meta', name: '@index', sigil: '@' },
    { template: '{{#items}}', kind: 'section-open', name: 'items', sigil: '#' },
    { template: '{{/items}}', kind: 'section-close', name: 'items', sigil: '/' },
    { template: '{{> header}}', kind: 'partial', name: 'header', sigil: '>' },
    { template: '{{!note}}', kind: 'comment', name: 'note', sigil: '!' },
    { template: '{{=<% %>=}}', kind: 'set-delimiter', name: '<% %>', sigil: '=' },
];

for (const expected of cases) {
    test(`parses ${expected.kind}`, () => {
        const tag = singleTag(expected.template);

        assert.equal(tag.kind, expected.kind);
        assert.equal(tag.name, expected.name);
        assert.equal(tag.sigil, expected.sigil);
        assert.equal(sourceSpan(expected.template, tag.tagOffset, tag.tagLength), expected.template);
        assert.equal(sourceSpan(expected.template, tag.nameOffset, tag.nameLength), expected.name);

        if (tag.sigilLength > 0) {
            assert.equal(
                sourceSpan(expected.template, tag.sigilOffset, tag.sigilLength),
                expected.sigil,
            );
        }
    });
}

test('parses every block sigil as a section opener', () => {
    for (const sigil of '#^*%?<~$') {
        const tag = singleTag(`{{${sigil}value}}`);
        assert.equal(tag.kind, 'section-open');
        assert.equal(tag.sigil, sigil);
        assert.equal(tag.name, 'value');
    }
});

test('parses a dynamic partial sigil', () => {
    const tag = singleTag('{{>* template}}');
    assert.equal(tag.kind, 'partial');
    assert.equal(tag.sigil, '>*');
    assert.equal(sourceSpan('{{>* template}}', tag.sigilOffset, tag.sigilLength), '>*');
});

test('applies a delimiter change to following tags', () => {
    const template = '{{=<% %>=}}<%#items%><%name%><%/items%>';
    const tags = parse(template);

    assert.deepEqual(tags.map(tag => tag.kind), [
        'set-delimiter',
        'section-open',
        'variable',
        'section-close',
    ]);
    assert.deepEqual(tags.map(tag => tag.name), ['<% %>', 'items', 'name', 'items']);
    assert.equal(tags[0].customDelim, false);

    for (const tag of tags.slice(1)) {
        assert.equal(tag.customDelim, true);
        assert.equal(tag.openDelimLen, 2);
        assert.equal(tag.closeDelimLen, 2);
        assert.equal(sourceSpan(template, tag.tagOffset, tag.tagLength),
            template.slice(tag.tagOffset, tag.tagOffset + tag.tagLength));
    }
});

test('supports arbitrary delimiter pairs and restores defaults', () => {
    const template = '{{=[[ ]]=}}[[value]][[={{ }}=]]{{after}}';
    const tags = parse(template);

    assert.deepEqual(tags.map(tag => [tag.kind, tag.name]), [
        ['set-delimiter', '[[ ]]'],
        ['variable', 'value'],
        ['set-delimiter', '{{ }}'],
        ['variable', 'after'],
    ]);
    assert.equal(tags[1].customDelim, true);
    assert.equal(tags[1].openDelimLen, 2);
    assert.equal(tags[1].closeDelimLen, 2);
    assert.equal(tags[2].customDelim, true);
    assert.equal(tags[3].customDelim, false);
    assert.equal(sourceSpan(template, tags[3].tagOffset, tags[3].tagLength), '{{after}}');
});

function singleTag(template) {
    const tags = parse(template);
    assert.equal(tags.length, 1);
    return tags[0];
}

function sourceSpan(template, offset, length) {
    return template.slice(offset, offset + length);
}
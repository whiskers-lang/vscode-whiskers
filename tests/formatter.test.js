const assert = require('node:assert/strict');
const test = require('node:test');
const { formatDocument, formatRange } = require('../out/formatter');

test('formats nested default-delimiter sections', () => {
    const input = [
        '  {{#users}}',
        '{{name}}',
        '    {{#active}}',
        'enabled',
        ' {{/active}}',
        '{{/users}}',
    ].join('\n');

    const expected = [
        '{{#users}}',
        '  {{name}}',
        '  {{#active}}',
        '    enabled',
        '  {{/active}}',
        '{{/users}}',
        '',
    ].join('\n');

    assert.equal(formatDocument(input, { insertSpaces: true, tabSize: 2 }), expected);
});

test('formats nested custom-delimiter sections', () => {
    const input = [
        '{{=[[ ]]=}}',
        ' [[#users]]',
        '[[name]]',
        '    [[#active]]',
        'enabled',
        '[[/active]]',
        '  [[/users]]',
    ].join('\n');

    const expected = [
        '{{=[[ ]]=}}',
        '[[#users]]',
        '  [[name]]',
        '  [[#active]]',
        '    enabled',
        '  [[/active]]',
        '[[/users]]',
        '',
    ].join('\n');

    assert.equal(formatDocument(input, { insertSpaces: true, tabSize: 2 }), expected);
});

test('does not treat inline section tags as indentation boundaries', () => {
    const input = [
        '  before {{#items}}',
        '    {{name}}',
        '  {{/items}} after',
    ].join('\n');
    const expected = [
        'before {{#items}}',
        '{{name}}',
        '{{/items}} after',
        '',
    ].join('\n');

    assert.equal(formatDocument(input, { insertSpaces: true, tabSize: 2 }), expected);
});

test('preserves CRLF line endings', () => {
    const input = '{{#item}}\r\nvalue\r\n{{/item}}\r\n';
    const expected = '{{#item}}\r\n\tvalue\r\n{{/item}}\r\n';

    assert.equal(formatDocument(input, { insertSpaces: false, tabSize: 4 }), expected);
});

test('formats a range at its surrounding section depth', () => {
    const documentText = '{{#outer}}\n first  \n  second\n{{/outer}}\n';
    const rangeText = ' first  \n  second\n';
    const rangeStart = documentText.indexOf(rangeText);
    const range = { start: {} };
    const document = {
        getText: () => documentText,
        offsetAt: position => {
            assert.equal(position, range.start);
            return rangeStart;
        },
    };

    assert.equal(
        formatRange(rangeText, range, { insertSpaces: true, tabSize: 2 }, document),
        '  first\n  second\n',
    );
});
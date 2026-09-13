const assert = require('node:assert/strict');
const test = require('node:test');
const { collectPlaintextContentRanges } = require('../out/contentHighlightingData');

test('collects content outside Mustache tags', () => {
    const template = 'before {{name}} between {{! note }} after';
    const ranges = collectPlaintextContentRanges(template);

    assert.deepEqual(ranges.map(range => sourceText(template, range)), [
        'before ',
        ' between ',
        ' after',
    ]);
});

test('collects content around adjacent tags and custom delimiters', () => {
    const template = 'start{{name}}{{=<% %>=}}middle<%@index%>end';
    const ranges = collectPlaintextContentRanges(template);

    assert.deepEqual(ranges.map(range => sourceText(template, range)), ['start', 'middle', 'end']);
});

test('collects the whole document when it has no tags', () => {
    assert.deepEqual(collectPlaintextContentRanges('plain text'), [{ offset: 0, length: 10 }]);
    assert.deepEqual(collectPlaintextContentRanges(''), []);
});

function sourceText(template, range) {
    return template.slice(range.offset, range.offset + range.length);
}

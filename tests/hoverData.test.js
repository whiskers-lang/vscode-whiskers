const assert = require('node:assert/strict');
const test = require('node:test');
const { findHoverData } = require('../out/hoverData');

test('finds a section sigil hover', () => {
    const template = '{{#items}}';
    assert.deepEqual(findHoverData(template, template.indexOf('#')), {
        label: '# Value is truthy',
        description: 'Render when the value is truthy.',
        offset: template.indexOf('#'),
        length: 1,
    });
});

test('finds a dynamic partial sigil hover across both characters', () => {
    const template = '{{>* partial}}';
    const expected = {
        label: '>* Dynamic partial',
        description: 'Render a partial whose name comes from data.',
        offset: template.indexOf('>'),
        length: 2,
    };
    assert.deepEqual(findHoverData(template, template.indexOf('>')), expected);
    assert.deepEqual(findHoverData(template, template.indexOf('*')), expected);
});

test('finds iteration metadata in variables and sections', () => {
    for (const template of ['{{@index}}', '{{#@first}}']) {
        const metadataOffset = template.indexOf('@');
        const hover = findHoverData(template, metadataOffset + 1);
        assert.equal(hover.offset, metadataOffset);
        assert.equal(hover.label, template.includes('index') ? '@index' : '@first');
    }
});

test('limits root metadata hover to the root keypath segment', () => {
    const template = '{{@root.siteName}}';
    const hover = findHoverData(template, template.indexOf('root'));
    assert.equal(hover.label, '@root');
    assert.equal(hover.length, '@root'.length);
    assert.equal(findHoverData(template, template.indexOf('siteName')), undefined);
});

test('supports sigil and metadata hovers with custom delimiters', () => {
    const template = '{{=<% %>=}}<%?@last%>';
    assert.equal(findHoverData(template, template.indexOf('?')).label, '? Value is null');
    assert.equal(findHoverData(template, template.indexOf('@last') + 1).label, '@last');
});

test('does not hover ordinary names or delimiters', () => {
    const template = '{{name}}';
    assert.equal(findHoverData(template, template.indexOf('name')), undefined);
    assert.equal(findHoverData(template, 0), undefined);
});
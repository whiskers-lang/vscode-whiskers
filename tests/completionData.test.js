const assert = require('node:assert/strict');
const test = require('node:test');
const {
    METADATA_COMPLETIONS,
    SIGIL_COMPLETIONS,
    metadataCompletionsAt,
    shouldOfferMetadataCompletions,
    shouldOfferSigilCompletions,
} = require('../out/completionData');

test('provides every Whiskers tag sigil', () => {
    assert.deepEqual(
        SIGIL_COMPLETIONS.map(completion => completion.sigil),
        ['#', '^', '~', '?', '*', '%', '<', '$', '/', '>', '>*', '&', '!', '='],
    );
});

test('keeps display labels separate from inserted sigils', () => {
    for (const completion of SIGIL_COMPLETIONS) {
        assert.equal(completion.label.startsWith(completion.sigil), false);
    }
});

test('offers sigils after the default opening delimiter', () => {
    assert.equal(shouldOfferSigilCompletions('{{', 2), true);
    assert.equal(shouldOfferSigilCompletions('{{   ', 5), true);
});

test('offers sigils after the active custom opening delimiter', () => {
    const template = '{{=<% %>=}}<%';
    assert.equal(shouldOfferSigilCompletions(template, template.length), true);
});

test('does not offer sigils outside an empty tag', () => {
    assert.equal(shouldOfferSigilCompletions('plain text', 10), false);
    assert.equal(shouldOfferSigilCompletions('{{name', 6), false);
    assert.equal(shouldOfferSigilCompletions('{{{', 3), false);
});

test('does not use inactive default delimiters', () => {
    const template = '{{=<% %>=}} {{';
    assert.equal(shouldOfferSigilCompletions(template, template.length), false);
});

test('provides iteration and root metadata', () => {
    assert.deepEqual(
        METADATA_COMPLETIONS.map(completion => completion.label),
        ['@index', '@number', '@first', '@last', '@length', '@root'],
    );
});

test('offers metadata after @ in variable and section tags', () => {
    for (const template of ['{{@', '{{@in', '{{#@', '{{^ @']) {
        assert.equal(shouldOfferMetadataCompletions(template, template.length), true);
    }
});

test('offers metadata with active custom delimiters', () => {
    const template = '{{=<% %>=}}<%@';
    assert.equal(shouldOfferMetadataCompletions(template, template.length), true);
});

test('offers iteration metadata after an alias qualifier', () => {
    const template = '{{@row.';
    assert.equal(shouldOfferMetadataCompletions(template, template.length), true);
    assert.deepEqual(
        metadataCompletionsAt(template, template.length).map(completion => completion.name),
        ['index', 'number', 'first', 'last', 'length'],
    );
});

test('does not offer metadata outside a tag or after a keypath separator', () => {
    for (const template of ['@', '{{name @', '{{@root.']) {
        assert.equal(shouldOfferMetadataCompletions(template, template.length), false);
    }
});
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const grammar = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'syntaxes', 'whiskers.tmLanguage.json'),
    'utf8',
));

test('does not hard-code a custom delimiter pair', () => {
    const source = JSON.stringify(grammar);
    assert.equal(source.includes('<%'), false);
    assert.equal(source.includes('%>'), false);
    assert.equal(Object.keys(grammar.repository).some(name =>
        name.startsWith('erb-') || name.startsWith('percent-')), false);
});

test('match rules recognize default delimiters', () => {
    const cases = [
        ['set-delimiter', '{{=[[ ]]=}}'],
        ['unescaped', '{{& value}}'],
        ['section-close', '{{/items}}'],
        ['partial', '{{> card}}'],
        ['variable-meta', '{{@index}}'],
        ['variable', '{{name}}'],
    ];

    for (const [ruleName, defaultTag] of cases) {
        const regex = anchored(grammar.repository[ruleName].match);
        assert.match(defaultTag, regex, ruleName);
    }
});

test('section openers share arguments and support every Whiskers sigil', () => {
    const defaultRule = grammar.repository['section-open'];
    for (const sigil of '#^*%?<~$') {
        assert.match(`{{${sigil}value :alias 42}}`, new RegExp(defaultRule.begin));
    }
    assert.deepEqual(defaultRule.patterns, [{ include: '#section-arguments' }]);
    const argumentPatterns = grammar.repository['section-arguments'].patterns;
    assert.equal(argumentPatterns.length, 6);
    assert.equal(argumentPatterns[4].captures['1'].name, 'keyword.operator.mustache');
    assert.equal(argumentPatterns[4].captures['2'].name, 'variable.other.mustache');
    assert.equal(argumentPatterns[5].name, 'string.unquoted.mustache');
});

test('ordinary sections use a data-key scope', () => {
    assert.equal(
        grammar.repository['section-open'].beginCaptures['3'].name,
        'variable.other.mustache',
    );
    assert.equal(
        grammar.repository['section-close'].captures['3'].name,
        'variable.other.mustache',
    );
});

test('comment rules recognize default delimiters', () => {
    const defaultRule = grammar.repository.comment;
    assert.match('{{! note }}', new RegExp(defaultRule.begin));
    assert.match('}}', anchored(defaultRule.end));
});

test('triple mustache remains default-delimiter only', () => {
    const regex = anchored(grammar.repository.triple.match);
    assert.match('{{{name}}}', regex);
    assert.doesNotMatch('[[[name]]]', regex);
});

function anchored(pattern) {
    return new RegExp(`^(?:${pattern})$`);
}
const assert = require('node:assert/strict');
const test = require('node:test');
const {
    collectSemanticTokens,
    TOKEN_MODS,
    TOKEN_TYPES,
} = require('../out/semanticTokenData');
const {
    COLOR_SCHEMES,
    PRESET_PLAINTEXT_COLORS,
    resolveColorScheme,
    resolvePresetPlaintextColor,
} = require('../out/colorSchemeData');

test('classifies semantic token spans', () => {
    const template = [
        '{{=[[ ]]=}}',
        '[[#items:item]]',
        '[[item]] [[name]] [[@index]] [[> card]]',
        '[[/items]]',
    ].join('\n');
    const tokens = collectSemanticTokens(template).map(token => ({
        text: template.slice(token.offset, token.offset + token.length),
        type: token.type,
        mods: token.mods,
    }));

    assert.ok(tokens.some(token => token.text === '[[' && token.type === 'whiskersDelimiter'));
    assert.ok(tokens.some(token => token.text === ']]' && token.type === 'whiskersDelimiter'));
    assert.ok(tokens.some(token => token.text === '#' && token.type === 'whiskersSigil'));
    assert.ok(tokens.some(token => token.text === '>' && token.type === 'whiskersSigil'));
    assert.ok(tokens.some(token => token.text === '/' && token.type === 'whiskersSigil'));
    assert.ok(tokens.some(token => token.text === 'items' && token.type === 'whiskersSection'));
    assert.ok(tokens.some(token => token.text === 'name' && token.type === 'whiskersVariable'));
    assert.ok(tokens.some(token => token.text === 'card' && token.type === 'whiskersPartial'));
    assert.ok(tokens.some(token => token.text === '@index' && token.type === 'whiskersMetadata'));

    const aliases = tokens.filter(token => token.text === 'item' && token.type === 'whiskersAlias');
    assert.equal(aliases.length, 2);
    assert.equal(aliases[0].mods, 1 << TOKEN_MODS.indexOf('declaration'));
    assert.equal(aliases[1].mods, 0);
});

test('distinguishes semantic template concepts', () => {
    const template = [
        '{{! note }}',
        '{{title}}',
        '{{@root.site}}',
        '{{> card}}',
        '{{#items}}{{/items}}',
        '{{#truncate 80}}body{{/truncate}}',
    ].join('\n');
    const tokens = collectSemanticTokens(template);
    const categories = tokens.map(token => ({
        text: template.slice(token.offset, token.offset + token.length),
        type: token.type,
    }));

    assert.ok(categories.some(token => token.text === '{{' && token.type === 'whiskersDelimiter'));
    assert.ok(categories.some(token => token.text === '{{! note }}' && token.type === 'whiskersComment'));
    assert.ok(categories.some(token => token.text === '#' && token.type === 'whiskersSigil'));
    assert.ok(categories.some(token => token.text === 'title' && token.type === 'whiskersVariable'));
    assert.ok(categories.some(token => token.text === '@root.site' && token.type === 'whiskersMetadata'));
    assert.ok(categories.some(token => token.text === 'card' && token.type === 'whiskersPartial'));
    assert.ok(categories.some(token => token.text === 'items' && token.type === 'whiskersSection'));
    assert.equal(categories.filter(token => token.text === 'truncate').length, 2);
    assert.ok(categories
        .filter(token => token.text === 'truncate')
        .every(token => token.type === 'whiskersLambda'));
});

test('color presets cover every semantic token', () => {
    for (const colors of Object.values(COLOR_SCHEMES)) {
        assert.deepEqual(Object.keys(colors), TOKEN_TYPES);
        for (const color of Object.values(colors)) {
            assert.match(color, /^#[0-9a-f]{6}$/i);
        }
    }
    for (const color of Object.values(PRESET_PLAINTEXT_COLORS)) {
        assert.match(color, /^#[0-9a-f]{6}$/i);
    }
});

test('comments remain green in every preset', () => {
    for (const colors of Object.values(COLOR_SCHEMES)) {
        const [red, green, blue] = colors.whiskersComment
            .match(/[0-9a-f]{2}/gi)
            .map(channel => parseInt(channel, 16));
        assert.ok(green > red && green > blue, `${colors.whiskersComment} should be green`);
    }
});

test('Cobalt provides blue template colors and an orange plaintext fallback', () => {
    const { whiskersComment, ...colors } = COLOR_SCHEMES.cobalt;
    assert.equal(whiskersComment, '#6f9f73');
    for (const color of Object.values(colors)) {
        const [red, green, blue] = color.match(/[0-9a-f]{2}/gi).map(channel => parseInt(channel, 16));
        assert.ok(blue > green && green > red, `${color} should be blue-forward`);
    }
    assert.equal(PRESET_PLAINTEXT_COLORS.cobalt, '#d98b5f');
    assert.equal(resolvePresetPlaintextColor('cobalt', false), '#d98b5f');
    assert.equal(resolvePresetPlaintextColor('ember', false), undefined);
    assert.equal(resolvePresetPlaintextColor('custom', false), undefined);
});

test('two-tone presets provide contrasting plaintext fallbacks', () => {
    assert.deepEqual(Object.keys(PRESET_PLAINTEXT_COLORS), [
        'cobalt',
        'jade',
        'violet',
        'rose',
    ]);
});

test('automatic color scheme selects Ember for dark and Paper for light', () => {
    assert.equal(resolveColorScheme('theme', false), 'ember');
    assert.equal(resolveColorScheme('theme', true), 'paper');
    assert.equal(resolveColorScheme('custom', false), undefined);
    assert.equal(resolveColorScheme('custom', true), undefined);
    assert.equal(resolveColorScheme('harbor', true), 'harbor');
    assert.equal(resolveColorScheme('signal', false), 'signal');
});

test('classifies lambda arguments with custom delimiters', () => {
    const template = '{{=[[ ]]=}}[[#wrap :aside aside "side panel" 2 *page.depth]]x[[/wrap]]';
    const tokens = collectSemanticTokens(template).map(token => ({
        text: template.slice(token.offset, token.offset + token.length),
        type: token.type,
    }));

    assert.equal(tokens.filter(token => token.text === 'aside' && token.type === 'whiskersStringArgument').length, 1);
    assert.equal(tokens.filter(token => token.text === 'aside' && token.type === 'whiskersAlias').length, 1);
    assert.ok(tokens.some(token => token.text === '"side panel"' && token.type === 'whiskersStringArgument'));
    assert.ok(tokens.some(token => token.text === '2' && token.type === 'whiskersNumberArgument'));
    assert.ok(tokens.some(token => token.text === '*' && token.type === 'whiskersSigil'));
    assert.ok(tokens.some(token => token.text === 'page.depth' && token.type === 'whiskersVariable'));
});
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { findDefinitionTarget, resolveTemplateRoots } = require('../out/definitionTargets');
const { findAliasDeclaration } = require('../out/aliasTargets');

test('finds an in-scope alias declaration', () => {
    const template = '{{#items:item}}{{item}}{{/items}}';
    const usageOffset = template.indexOf('{{item}}') + 3;

    assert.deepEqual(findDefinitionTarget(template, usageOffset, 'template.whiskers'), {
        kind: 'range',
        offset: template.indexOf(':item') + 1,
        length: 'item'.length,
    });
});

test('does not find an alias outside its scope', () => {
    const template = '{{#items:item}}{{/items}}{{item}}';
    const usageOffset = template.lastIndexOf('item') + 1;

    assert.equal(findDefinitionTarget(template, usageOffset, 'template.whiskers'), undefined);
});

test('finds a neighboring partial file', testContext => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'whiskers-definitions-'));
    testContext.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const documentPath = path.join(directory, 'template.whiskers');
    const partialPath = path.join(directory, 'card.mustache');
    fs.writeFileSync(partialPath, 'card');
    const template = '{{> card}}';

    assert.deepEqual(findDefinitionTarget(template, template.indexOf('card') + 1, documentPath), {
        kind: 'file',
        path: partialPath,
    });
});

test('does not resolve a missing partial', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'whiskers-definitions-'));
    try {
        const template = '{{> missing}}';
        assert.equal(
            findDefinitionTarget(template, template.indexOf('missing') + 1,
                path.join(directory, 'template.whiskers')),
            undefined,
        );
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

test('finds the nearest alias declaration for dotted references', () => {
    const template = '{{#outer:item}}{{#inner:item}}{{item.name}}{{/inner}}{{/outer}}';
    const declarations = [...template.matchAll(/:item/g)].map(match => match.index + 1);
    const target = findAliasDeclaration(template, template.indexOf('item.name') + 1);

    assert.equal(target.offset, declarations[1]);
    assert.equal(target.length, 'item'.length);
});

test('searches configured template roots before parent directories', testContext => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'whiskers-definitions-'));
    testContext.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const templateDirectory = path.join(directory, 'pages', 'account');
    const configuredRoot = path.join(directory, 'shared');
    fs.mkdirSync(templateDirectory, { recursive: true });
    fs.mkdirSync(configuredRoot);
    fs.writeFileSync(path.join(directory, 'card.whiskers'), 'parent');
    const configuredPartial = path.join(configuredRoot, 'card.mustache');
    fs.writeFileSync(configuredPartial, 'configured');
    const template = '{{> card}}';

    assert.deepEqual(findDefinitionTarget(
        template,
        template.indexOf('card'),
        path.join(templateDirectory, 'profile.whiskers'),
        [configuredRoot],
    ), { kind: 'file', path: configuredPartial });
});

test('walks parent directories after checking the template directory', testContext => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'whiskers-definitions-'));
    testContext.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const templateDirectory = path.join(directory, 'pages', 'account');
    fs.mkdirSync(templateDirectory, { recursive: true });
    const parentPartial = path.join(directory, 'header.wsk');
    fs.writeFileSync(parentPartial, 'header');
    const template = '{{> header}}';

    assert.deepEqual(findDefinitionTarget(
        template,
        template.indexOf('header'),
        path.join(templateDirectory, 'profile.whiskers'),
    ), { kind: 'file', path: parentPartial });
});

test('prefers a partial beside the template over parent matches', testContext => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'whiskers-definitions-'));
    testContext.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const templateDirectory = path.join(directory, 'pages');
    fs.mkdirSync(templateDirectory);
    fs.writeFileSync(path.join(directory, 'footer.whiskers'), 'parent');
    const neighboringPartial = path.join(templateDirectory, 'footer.mst');
    fs.writeFileSync(neighboringPartial, 'neighbor');
    const template = '{{> footer}}';

    assert.deepEqual(findDefinitionTarget(
        template,
        template.indexOf('footer'),
        path.join(templateDirectory, 'page.whiskers'),
    ), { kind: 'file', path: neighboringPartial });
});

test('does not navigate dynamic partial names as files', testContext => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'whiskers-definitions-'));
    testContext.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    fs.writeFileSync(path.join(directory, 'partial.whiskers'), 'partial');
    const template = '{{>* partial}}';

    assert.equal(findDefinitionTarget(
        template,
        template.indexOf('partial'),
        path.join(directory, 'page.whiskers'),
    ), undefined);
});

test('resolves configured roots relative to the workspace', () => {
    const workspace = path.resolve('workspace');
    const absolute = path.resolve('shared');

    assert.deepEqual(resolveTemplateRoots(
        [' templates ', '', absolute],
        workspace,
    ), [path.join(workspace, 'templates'), absolute]);
});
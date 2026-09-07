const test = require('node:test');
const assert = require('node:assert/strict');

const { compareVersions, parseVersion } = require('../scripts/validate-version');

test('parses stable and prerelease versions', () => {
    assert.deepEqual(parseVersion('1.2.3'), { core: [1, 2, 3], prerelease: [] });
    assert.deepEqual(parseVersion('1.2.3-beta.2'), { core: [1, 2, 3], prerelease: ['beta', '2'] });
    assert.throws(() => parseVersion('1.2'), /Invalid semantic version/);
});

test('compares semantic versions', () => {
    assert.equal(compareVersions('1.0.1', '1.0.0'), 1);
    assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
    assert.equal(compareVersions('1.0.0-beta.2', '1.0.0-beta.10'), -1);
    assert.equal(compareVersions('1.0.0', '1.0.0-beta.1'), 1);
});
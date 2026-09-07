/* global fetch, module, process */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const version = packageJson.version;
const extensionId = `${packageJson.publisher}.${packageJson.name}`;

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const publishablePaths = [
    'src/',
    'syntaxes/',
    'icons/',
    'language-configuration.json',
];

function parseVersion(value) {
    const match = semverPattern.exec(value);
    if (!match) throw new Error(`Invalid semantic version: ${value}`);
    return {
        core: match.slice(1, 4).map(Number),
        prerelease: match[4]?.split('.') ?? [],
    };
}

function compareVersions(left, right) {
    const a = parseVersion(left);
    const b = parseVersion(right);
    for (let index = 0; index < a.core.length; index++) {
        if (a.core[index] !== b.core[index]) return Math.sign(a.core[index] - b.core[index]);
    }
    if (!a.prerelease.length || !b.prerelease.length) {
        return Math.sign(b.prerelease.length - a.prerelease.length);
    }
    const length = Math.max(a.prerelease.length, b.prerelease.length);
    for (let index = 0; index < length; index++) {
        const aPart = a.prerelease[index];
        const bPart = b.prerelease[index];
        if (aPart === undefined || bPart === undefined) return aPart === undefined ? -1 : 1;
        if (aPart === bPart) continue;
        const aNumber = /^\d+$/.test(aPart) ? Number(aPart) : undefined;
        const bNumber = /^\d+$/.test(bPart) ? Number(bPart) : undefined;
        if (aNumber !== undefined && bNumber !== undefined) return Math.sign(aNumber - bNumber);
        if (aNumber !== undefined || bNumber !== undefined) return aNumber !== undefined ? -1 : 1;
        return aPart < bPart ? -1 : 1;
    }
    return 0;
}

function validateLocalVersions() {
    parseVersion(version);
    const lockVersions = [packageLock.version, packageLock.packages?.['']?.version];
    if (lockVersions.some(lockVersion => lockVersion !== version)) {
        throw new Error(`Version ${version} must match package-lock.json (${lockVersions.join(', ')}).`);
    }
}

function validateVersionBump(baseRef) {
    if (!baseRef || /^0+$/.test(baseRef)) return;
    const changedFiles = execFileSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], { encoding: 'utf8' })
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
    const basePackage = JSON.parse(execFileSync('git', ['show', `${baseRef}:package.json`], { encoding: 'utf8' }));
    const publishedManifest = manifest => {
        const result = JSON.parse(JSON.stringify(manifest));
        delete result.version;
        delete result.scripts;
        delete result.devDependencies;
        return result;
    };
    const manifestChanged = changedFiles.includes('package.json')
        && JSON.stringify(publishedManifest(packageJson)) !== JSON.stringify(publishedManifest(basePackage));
    const productChanged = manifestChanged
        || changedFiles.some(file => publishablePaths.some(path => file === path || file.startsWith(path)));
    if (!productChanged) return;

    if (compareVersions(version, basePackage.version) <= 0) {
        throw new Error(`Publishable code changed, so version ${version} must be greater than ${basePackage.version}.`);
    }
}

function validateBranch(targetBranch) {
    if (targetBranch === 'main' && parseVersion(version).prerelease.length) {
        throw new Error(`Prerelease version ${version} cannot target main.`);
    }
}

async function validateUnpublished() {
    const response = await fetch('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
        method: 'POST',
        headers: {
            Accept: 'application/json;api-version=3.0-preview.1',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filters: [{
                pageNumber: 1,
                pageSize: 1,
                criteria: [{ filterType: 7, value: extensionId }],
            }],
            assetTypes: [],
            flags: 1,
        }),
    });
    if (!response.ok) throw new Error(`Marketplace query failed with HTTP ${response.status}.`);
    const body = await response.json();
    const extension = body.results?.[0]?.extensions?.find(candidate =>
        `${candidate.publisher.publisherName}.${candidate.extensionName}`.toLowerCase() === extensionId.toLowerCase());
    if (extension?.versions?.some(candidate => candidate.version === version)) {
        throw new Error(`${extensionId}@${version} is already published.`);
    }
}

async function main() {
    validateLocalVersions();
    validateVersionBump(process.env.VERSION_BASE);
    validateBranch(process.env.TARGET_BRANCH);
    await validateUnpublished();
    console.log(`Validated unpublished version ${extensionId}@${version}.`);
}

if (require.main === module) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { compareVersions, parseVersion };

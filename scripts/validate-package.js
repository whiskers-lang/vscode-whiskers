const fs = require('node:fs');

const files = fs.readFileSync(0, 'utf8')
    .split(/\r?\n/)
    .map(file => file.trim().replaceAll('\\', '/'))
    .filter(Boolean);

const required = [
    'package.json',
    'out/extension.js',
    'language-configuration.json',
    'syntaxes/whiskers.tmLanguage.json',
    'icons/mustache.svg',
    'ThirdPartyNotices.txt',
];
const forbiddenPrefixes = [
    'src/',
    'tests/',
    'examples/',
    'node_modules/',
];

for (const file of required) {
    if (!files.includes(file)) throw new Error(`Package is missing ${file}`);
}
for (const prefix of forbiddenPrefixes) {
    const found = files.find(file => file.startsWith(prefix));
    if (found) throw new Error(`Package unexpectedly contains ${found}`);
}

console.log(`Validated ${files.length} packaged files.`);
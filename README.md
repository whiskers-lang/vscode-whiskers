# Whiskers for VS Code

Language support for Whiskers and Mustache templates, including formatting,
semantic highlighting, diagnostics, navigation, completions, hovers, rename,
folding, and document symbols.

## Colors

`whiskers.colorScheme` defaults to `theme`, which automatically uses Ember with
dark and high-contrast-dark themes, and Paper with light and
high-contrast-light themes. The `ember`, `harbor`, `paper`, and `signal` options
pin the exact syntax palettes shown in the color study.

Whiskers exposes `mustacheDelimiter`, `mustacheSigil`, `mustacheSection`,
`mustacheVariable`, `mustacheMetadata`, `mustachePartial`, `mustacheLambda`,
`mustacheStringArgument`, and `mustacheNumberArgument` semantic token types.
Dynamic lambda arguments use `mustacheVariable`, with their `*` marker using
`mustacheSigil`. Palette decorations intentionally take precedence over
semantic-token theme rules.

## Template roots

Partial definition navigation checks `whiskers.templateRoots` first, then the
current template directory and each parent directory. Relative configured roots
are resolved from the containing workspace folder.

## Development

Open the repository in its development container to use the pinned Node.js 20
toolchain. The container installs the locked dependencies automatically.

Install exactly the locked dependencies and run all checks:

```text
npm ci
npm run check
```

Build and validate a publishable VSIX:

```text
npm run package:vsix
```

Compilation cleans and regenerates the ignored `out/` directory from `src/`
before testing or packaging.
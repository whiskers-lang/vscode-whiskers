# Whiskers for VS Code

Language support for Whiskers and Mustache templates, including formatting,
semantic highlighting, diagnostics, navigation, completions, hovers, rename,
folding, and document symbols.

## Colors

`whiskers.colorScheme` defaults to `theme`, which automatically uses Ember with
dark and high-contrast-dark themes, and Paper with light and
high-contrast-light themes. Dark presets include `ember`, `harbor`, `canopy`,
and `afterglow`; light presets include `paper`, `signal`, and `solar`. The
two-tone presets are Cobalt & Copper (`cobalt`), Jade & Clay (`jade`), Violet &
Brass (`violet`), and Rose & Slate (`rose`). They pair a family of template
colors with a contrasting generated-content fallback when Plain Text
highlighting is enabled. The `custom` option applies no palette decorations,
allowing the active theme and
`editor.semanticTokenColorCustomizations` to control token colors.
Comments remain green across all built-in palettes as a consistent semantic
cue.

Whiskers exposes `whiskersDelimiter`, `whiskersComment`, `whiskersSigil`,
`whiskersSection`, `whiskersVariable`, `whiskersMetadata`, `whiskersPartial`,
`whiskersLambda`, `whiskersStringArgument`, and `whiskersNumberArgument`
semantic token types. Named scope declarations and references use
`whiskersAlias`, with declarations carrying the standard `declaration`
modifier.
Dynamic lambda arguments use `whiskersVariable`, with their `*` marker using
`whiskersSigil`. Palette decorations intentionally take precedence over
semantic-token theme rules.

Set `whiskers.contentHighlighting` to `plaintext` to display content outside
Mustache tags using the editor's normal foreground color. The eye button in a
Mustache or Whiskers editor title toggles between default and plain-text
content highlighting for the workspace. `whiskers.plaintextColor` sets its
foreground color. When unset, it uses the selected preset's fallback if one
exists, or the editor foreground otherwise.
`whiskers.plaintextOpacity` controls the content opacity from `0` to `1` and
defaults to `0.8`.
`whiskers.templateOpacity` independently controls tag opacity and defaults to
`1`.

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
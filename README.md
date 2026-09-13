# Whiskers for VS Code

Rich language support for Mustache and Whiskers templates. Format templates,
navigate partials and aliases, catch structural errors, and keep generated code
visually distinct from template logic.

Supports `.whiskers`, `.wsk`, `.mustache`, and `.mst` files.

## Features

- Format complete documents or selected ranges.
- Highlight variables, sections, metadata, aliases, partials, lambdas, and
	arguments with semantic tokens.
- Diagnose unmatched, mismatched, and unclosed sections; malformed delimiter
	changes; and invalid or out-of-scope aliases.
- Complete tag sigils and metadata, including alias-qualified metadata such as
	`@item.index`.
- Navigate to aliases and partial templates, with configurable template roots.
- Rename aliases and all references within their scope.
- Inspect syntax with hovers, folding ranges, and document symbols.
- Use default embedded HTML highlighting or a focused Plain Text mode for
	generated content.

## Getting started

Open a supported template file and Whiskers activates automatically. Format it
with **Format Document**, explore symbols from the Outline view, or use
**Go to Definition** on aliases and static partials.

Use the eye button in the editor title to switch generated content between
embedded-language highlighting and Plain Text mode.

For partial navigation, configure `whiskers.templateRoots` with directories to
search before the current template directory and its parents. Relative paths
are resolved from the containing workspace folder.

## Color schemes

The default **Automatic** scheme selects Ember for dark themes and Paper for
light themes. You can pin any built-in palette in Settings:

| Style | Palettes |
| --- | --- |
| Dark | Ember & Sea Glass, Harbor Signal, Canopy Workshop, Afterglow |
| Light | Paper Ledger, Signal on White, Solar Archive |
| Two-tone | Cobalt & Copper, Jade & Clay, Violet & Brass, Rose & Slate |

Two-tone palettes pair template colors with a contrasting generated-content
color when Plain Text mode is enabled.

Choose **Custom** to let your active VS Code theme and
`editor.semanticTokenColorCustomizations` control token colors without palette
overrides.

## Theme customization

For complete theme control, select the **Custom** color scheme and assign colors
to any of the semantic tokens below. Built-in palettes take precedence over
these rules.

```json
{
	"whiskers.colorScheme": "custom",
	"whiskers.contentHighlighting": "plaintext",
	"whiskers.plaintextColor": "#d19a66",
	"whiskers.plaintextOpacity": 0.8,
	"whiskers.templateOpacity": 1,
	"editor.semanticTokenColorCustomizations": {
		"rules": {
			"whiskersDelimiter": "#78909c",
			"whiskersComment": "#6f9f73",
			"whiskersSigil": "#ef6c75",
			"whiskersSection": "#e5c07b",
			"whiskersVariable": "#4fc3f7",
			"whiskersMetadata": "#98c379",
			"whiskersPartial": "#c678dd",
			"whiskersLambda": "#e06c9f",
			"whiskersStringArgument": "#98c379",
			"whiskersNumberArgument": "#d19a66",
			"whiskersAlias": "#e5c07b"
		}
	}
}
```

## Whiskers syntax

Whiskers extends Mustache with named scope aliases, metadata, dedicated
condition sigils, dynamic partials, template inheritance, blocks, lambda
arguments, and alternate delimiters. The extension continues to support
ordinary Mustache syntax in both language modes.

See the [template examples](examples/README.md) for representative syntax and
runtime-value expectations.

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
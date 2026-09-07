# Template examples

The examples are split into small introductions and larger feature showcases.
They are source samples for the VS Code extension; the extension does not render
them or provide their data context.

## Entry points

- `simple.mustache` covers variables, escaped and unescaped values, sections,
  inverted sections, lists, current context, and a partial.
- `example.mustache` adds dotted names, deeply nested sections, interpolation and
  section lambdas, multiple partials, and a delimiter change that is restored.
- `simple.whiskers` introduces aliases, iteration metadata, dedicated presence
  and null checks, a section lambda, and a partial.
- `example.whiskers` covers nested aliases, alias-qualified iteration metadata,
  root and local scopes, all condition sigils, static and dynamic partials,
  template inheritance, blocks, lambda arguments, and alternate delimiters.

The remaining templates are partials or parent templates referenced by those
entry points. Definition navigation can follow each static partial from its use
to the corresponding file.

## Runtime values

The advanced samples expect ordinary nested objects and lists plus these
callable values in the render context:

- `timestamp` and `build_label`: interpolation lambdas.
- `markdown`, `uppercase`, and `emphasis`: section lambdas whose returned
  templates are rendered again in the current context.
- `truncate`: an argument-taking section lambda receiving a numeric limit,
  either as a literal or from `*page.preview_length`.
- `wrap`: an argument-taking section lambda receiving a tag name and depth.
  The examples show quoted and unquoted string literals, mixed literal and
  dynamic arguments, and fully dynamic arguments from `*page.sidebar_tag` and
  `*page.sidebar_depth`.

`selected_card` is a string naming a partial for the dynamic partial example.
For example, it can resolve to `product-card`.

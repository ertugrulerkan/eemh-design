# eemh-design

The one source of RONCHAMP's design language: the tokens the panel (eemh-ronchamp), Tuval (eemh-tuval) and Render (eemh-render)
all draw with. Each of those stays in its own repository and takes this package at a release tag, the way the panel takes Tuval:

    "eemh-design": "github:ertugrulerkan/eemh-design#v0.1.0"

## Contract

- `tokens/*.json` is the source: colours (day by default, night), type sizes (11 / 12.5 / 13.5 / 15 / 17 px), control 28 px,
  field 30 px, radii 7 / 12 / 999, spacing, shadows, motion. Nothing else is edited by hand.
- `npm run build` writes what the consumers import, and a test fails when the written files differ from what the source makes:
  - `dist/tokens.css`: CSS custom properties, day on `:root` and `.light`, night under `.dark` (`.light` takes day back on an element inside a night page);
  - `dist/theme.css`: Tailwind 4's `@theme` mapping onto those properties;
  - `dist/tokens.js` + `dist/tokens.d.ts`: the same values for code.
- The first release reproduces the panel's own `src/panel/panel.css` values exactly: moving them here changes no pixel.
- `"files"` ships `dist/` alone; `.gitattributes` keeps every checkout LF whatever the machine's `core.autocrlf`.

## Layout

- `tokens/color.json`: the panel's `--background`, `--brand`, ... custom properties, as a `light` and a `dark` map, keyed by
  their original names, values copied verbatim (never rounded or converted).
- `tokens/theme.json`: the panel's `@theme inline` block, declarations in source order, values verbatim.
- `tokens/derived.json` (v0.2.0): the shades the consumers used to mix themselves with `color-mix()` (a stronger border and
  muted text, a fainter text, hover/active overlays, the rail-blue selection, hover, ink and foreground, the weak tint and the
  readable ink of destructive/warning/success, the primary's hover and soft tint), named once here. Each mixes only colour
  tokens both themes define, and is written into both `:root, .light` and `.dark`, so a `.dark` set on an element below the root mixes
  it again from that element's own night values. The mixes are the ones Tuval (faz 4) and Render (faz 3) drew with, verbatim:
  moving a consumer onto them changes no pixel.
- `tokens/scale.json`: the measured scale the panel keeps only as raw numbers in its components (type 11 / 12.5 / 13.5 / 15 /
  17 px, control 28 px, field 30 px, radii 7 / 12 / 999 px), under new `--size-*` / `--radius-*` names that never collide
  with a name `color.json` or `theme.json` already uses.

## Running it

- `npm run build` (plain Node, no dependencies) writes `dist/tokens.css`, `dist/theme.css`, `dist/tokens.js` and
  `dist/tokens.d.ts` from `tokens/*.json`.
- `npm test` (`node --test`) fails if the committed `dist/` has drifted from a fresh build, if a token value isn't a
  syntactically plausible CSS value, or if a scale token name collides with an existing one.
- `node scripts/compare-panel.mjs <path to panel.css>` resolves that panel.css's own `:root`/`.dark` scopes and `@theme
  inline` block (last declaration per property wins, as the cascade would) and diffs them against `dist/`, ignoring only
  the new scale tokens. It exits non-zero on any difference; see `docs/compare-panel.txt` for the first release's run
  against `eemh-ronchamp`'s `src/panel/panel.css`.

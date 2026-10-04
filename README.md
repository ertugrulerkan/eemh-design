# eemh-design

The one source of RONCHAMP's design language: the tokens the panel (eemh-ronchamp), Tuval (eemh-tuval) and Render (eemh-render)
all draw with. Each of those stays in its own repository and takes this package at a release tag, the way the panel takes Tuval:

    "eemh-design": "github:ertugrulerkan/eemh-design#v0.1.0"

## Contract

- `tokens/*.json` is the source: colours (day by default, night), type sizes (11 / 12.5 / 13.5 / 15 / 17 px), control 28 px,
  field 30 px, radii 7 / 12 / 999, spacing, shadows, motion. Nothing else is edited by hand.
- `npm run build` writes what the consumers import, and a test fails when the written files differ from what the source makes:
  - `dist/tokens.css`: CSS custom properties, day on `:root`, night under `.dark`;
  - `dist/theme.css`: Tailwind 4's `@theme` mapping onto those properties;
  - `dist/tokens.js` + `dist/tokens.d.ts`: the same values for code.
- The first release reproduces the panel's own `src/panel/panel.css` values exactly: moving them here changes no pixel.
- `"files"` ships `dist/` alone; `.gitattributes` keeps every checkout LF whatever the machine's `core.autocrlf`.

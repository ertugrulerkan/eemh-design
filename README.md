# eemh-design

The one source of RONCHAMP's design language: the tokens the panel (eemh-ronchamp), Tuval (eemh-tuval) and Render (eemh-render)
all draw with. Each of those stays in its own repository and takes this package at a release tag, the way the panel takes Tuval:

    "eemh-design": "github:ertugrulerkan/eemh-design#<tag>"

## Contract

- `tokens/*.json` is the source: colours (day by default, night), type sizes (11 / 12.5 / 13.5 / 15 / 17 px), control 28 px,
  field 30 px, radii 7 / 12 / 999, spacing, shadows, motion; `src/` is the source of the code (v0.3.0). Nothing else is edited
  by hand.
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
  moving a consumer onto them changes no pixel. In v0.5.1 the inks, weak tints and rail-blue shades that pull a colour toward a
  neutral mix in oklab: in oklch the neutral's written hue (`oklch(0.145 0 0)` has hue 0, and a browser mixes it so) turned
  them, the success ink brown, its band and the warning band pink, the rail-blue selection lilac. In oklab a neutral moves
  the lightness and the chroma alone, so each keeps its colour's hue, and they are drawn the colours the contrast gate read.
- `tokens/keyframes.css` (v0.2.2): the `@keyframes` the `--animate-*` tokens of theme.json name, written into `dist/theme.css`'s
  `@theme` block, so an animation a consumer uses runs without the panel's own copy. In v0.2.2 `--popover-hover` mixes 88% + 12%
  (it was 80% + 12%, 92% opaque, its backdrop showing through) and the day `--sidebar-foreground` is the sidebar's light ink, as
  the day sidebar is drawn dark.
- `src/` (v0.3.0, 12e): the panel's button, which the panel (eemh-ronchamp) and Render (eemh-render) each kept a copy of, moved
  here so it has one owner, compiled to `dist/button/` with its types and exported as `eemh-design/button`:
  - `src/button/index.tsx`: `Button` and `STILL`. beUI's moving button sized to the measurement standard, a control 28 high with its
    name on one line, `size="tile"` for a button as high as it holds with its words wrapping, still under the pointer; beUI's
    own `ButtonLink` beside it.
  - `src/button/registry/`: what it is built on, as its registries ship it (beUI's `motion/button/base`, its `lib/ease` and
    `lib/hooks/use-hover-capable`, shadcn's `lib/utils`), byte for byte but for the import paths, which are relative here. They
    are synced as the panel syncs its own (ui-rules K2: fetch the item's JSON, compare `files[].content`), never edited. The
    consumers keep their own copies of the `lib` files, which their other registry components import by path.

  It needs `react`, `motion`, `clsx` and `tailwind-merge` from the consumer (peer dependencies). Tailwind does not read
  `node_modules`, so a consumer names the package's code as a source in its stylesheet, or the button's classes are never
  written: `@source "<path to>/node_modules/eemh-design/dist/button";` (the folder holds the code alone, so
  the tokens' names in `dist/` do not count as used, and the compiled code carries no comments, whose words Tailwind would
  read as classes).
- `src/vite/` (v0.4.0, 13b-P2b): the fix for motion-dom's keyboard press, which the button presses through, kept with it: the file
  `dist/es/gestures/press/utils/keyboard.mjs` (the same from 13.3.0 to 14.4.0) leaves the keyup and blur listeners of every Enter
  press on the element, so the next blur, long after the press ended, fires a pointercancel that cancels a mouse press under way
  on another button (ronchamp #89). `eemh-design/vite` exports `pressKeyboard()`, a Vite and Rolldown plugin serving
  `KEYBOARD_PRESS` (each press owns its two listeners and ends once; each focus owns its keydown listener until its blur) in that
  file's place, held to its sha256 (`MOTION_KEYBOARD_SHA256`): a motion-dom that changes the file stops the build. A consumer
  that builds with motion puts it in `plugins` and in `optimizeDeps.rolldownOptions.plugins`.
- `tokens/pairs.json` and `scripts/contrast.mjs` (v0.5.0, 13b-D1): the contrast gate. The 839 contrast failures of 04.10
  (Tuval's accent as text, white on the accent) were found only in a consumer; the day theme's own of 20.10 (error, done and
  brand text on their own tints, chip text on a muted ground, 2.7 to 4.4 : 1) not at all. `pairs.json` lists the text pairs the
  consumers draw (the panel's own class combinations and Tuval's and Render's chrome, 50) and the pairs they must not
  (`misuse`, 12); `scripts/contrast.mjs` reads the tokens as a browser shows them (`oklch()`, `#hex`, `rgb()`, `color-mix()` in
  oklch, oklab and srgb, `var()`, a Tailwind alpha over the page) per theme, with WCAG 2 contrast; in oklch a hue written in
  `oklch()` is the colour's own even at chroma 0, as browsers mix it (v0.5.1). v0.5.0 also names the
  readable inks as Tailwind colours (`text-destructive-ink`, `-success-ink`, `-warning-ink`, `-brand-ink`,
  `text-muted-foreground-strong`), adds `--brand-ink` (the brand pulled 45% toward the foreground, as the others) and gives
  the night `--brand`, the day's value it already inherited, so a mix of it is a mix of colours both themes define.
- `tokens/scale.json`: the measured scale the panel keeps only as raw numbers in its components (type 11 / 12.5 / 13.5 / 15 /
  17 px, control 28 px, field 30 px, radii 7 / 12 / 999 px), under new `--size-*` / `--radius-*` names that never collide
  with a name `color.json` or `theme.json` already uses.

## Running it

- `npm run build` writes `dist/tokens.css`, `dist/theme.css`, `dist/tokens.js` and `dist/tokens.d.ts` from `tokens/*.json`
  (plain Node), then compiles `src/` into `dist/` with TypeScript (`npm install` first: the compiler and the peers are
  development dependencies; a consumer installing the package from its tag gets the committed `dist/` and none of them).
- `npm test` (`node --test`) fails if the committed `dist/` has drifted from a fresh build or a fresh compile of `src/`, if the served keyboard press leaks a listener or
  the plugin serves it for another file or past a changed one, if the
  button's sizes, tile, destructive variant or link draw otherwise than above, if a token value isn't a
  syntactically plausible CSS value, if a scale token name collides with an existing one, if a night colour has no day
  value (`.light` could not take it back), if a solid derived mix adds up to less than 100% (it would come out partly
  transparent), if a `package.json` export names a file `dist/` does not ship, if a text pair of `tokens/pairs.json` reads under
  4.5 : 1 in either theme (ui-rules A5), or if a pair it calls a misuse does not.
- `node scripts/compare-panel.mjs <path to panel.css>` resolves that panel.css's own `:root`/`.dark` scopes and `@theme
  inline` block (last declaration per property wins, as the cascade would) and diffs them against `dist/`, ignoring only
  the new scale tokens. It exits non-zero on any difference; see `docs/compare-panel.txt` for the first release's run
  against `eemh-ronchamp`'s `src/panel/panel.css`. A panel.css that already imports `eemh-design` (the panel's since v0.2.0)
  holds no copy to compare, and the script says so with exit 2.

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
- v0.7.0 (23.10.2026, the owner: "PANELİN TAMAMI GÖSTERİŞLİ OLACAK! TEK BİR TASARIM DİLİ OLACAK!"; the language is written in SOANE
  `belgeler/tasarim-dili/TASARIM-DILI.md`): the tokens of the panel's one design language.
  - `--viz-1`…`--viz-6`, the data colours every chart of every room draws its series with (`bg-viz-1`, `fill-[var(--viz-1)]`):
    each keeps its hue by day and night (`--chart-1` is orange by day and blue by night), stands at 3 : 1 on the card, the page and
    the raised panel (pairs.json `marks`), and every two stay apart for colour-blind eyes (test/contrast.test.mjs). A gain is
    `--success`, a loss `--destructive`, the one figure a screen is about `--brand`.
  - `--raised` and `--elevation-raised` (`bg-raised`, `shadow-raised`): a cockpit's panel, lifted off the room's ground (by night
    the card is the ground's own tone, so a panel showed only its line).
  - `--glow-brand`: the one light a screen's hero may wear. `--size-text-26` (a figure tile's number) and `--size-text-40` (a
    cockpit's hero figure), the only sizes above 17. `--ease-standard` (beUI's own ease-out, the one the panel's motion components already move by), `--duration-quick` / `-enter` / `-reveal`: how things move.
- `src/` (v0.3.0, 12e): the panel's button, which the panel (eemh-ronchamp) and Render (eemh-render) each kept a copy of, moved
  here so it has one owner, compiled to `dist/button/` with its types and exported as `eemh-design/button`:
  - `src/button/index.tsx`: `Button` and `STILL`. beUI's moving button sized to the measurement standard, a control 28 high with its
    name on one line, `size="tile"` for a button as high as it holds with its words wrapping, still under the pointer; beUI's
    own `ButtonLink` beside it.
    Every button names the variant it is drawn in on the element (`data-button`), beUI's default (primary) too (v0.5.2): a
    host's dress for bare buttons (Mies's `.mies-forms`) matched a button that named none.
    v0.5.3: `--chart-3` and `--chart-4` sit inside the chart lightness band with chroma and 3 : 1 against the card in both themes, and stay
    apart from their neighbours under colour-blind simulation (tokens/pairs.json `marks` holds the contrast).
    v0.5.4: `ButtonLink` is the panel's link drawn as a control: 28 high, its icon at 16, its variant named on the element; beUI's
    own link, at its own sizes, is `BeuiButtonLink`, for the site's pages (beUI's drew the Aldo room's links 32 high with a 24px arrow).
  - `src/button/registry/`: what it is built on, as its registries ship it (beUI's `motion/button/base`, its `lib/ease` and
    `lib/hooks/use-hover-capable`, shadcn's `lib/utils`), byte for byte but for the import paths, which are relative here. They
    are synced as the panel syncs its own (ui-rules K2: fetch the item's JSON, compare `files[].content`), never edited. The
    consumers keep their own copies of the `lib` files, which their other registry components import by path.

  It needs `react`, `motion`, `clsx` and `tailwind-merge` from the consumer (peer dependencies, optional: a page drawn without
  React, Mies, takes only `./iso/dom` and the stylesheets). Tailwind does not read
  `node_modules`, so a consumer names the package's code as a source in its stylesheet, or the button's classes are never
  written: `@source "<path to>/node_modules/eemh-design/dist/button";` (the folder holds the code alone, so
  the tokens' names in `dist/` do not count as used, and the compiled code carries no comments, whose words Tailwind would
  read as classes).
- `src/iso/` (23.10.2026, the owner: "tüm bekleme, loading ekranlarını izometrik animasyonlara çevir, sistem genelindeki hepsi" and
  "bekleme/boş ekranlarda da izometrik animasyon"): every wait and every empty place drawn isometric, with one owner for the panel,
  Render and Mies:
  - `src/iso/geometry.ts`: the drawings as data, framework-free. v0.6.0 (the owner, 23.10.2026: "HER YERE BAŞKA BİR İZOMETRİK
    animasyon yapılacak. konuyla modülle alakalı olarak hepsi farklı olacak"): nineteen motifs (`ISO_MOTIFS`), each a module's
    subject and in no other module: the product's building rising on its parcel, the overview's cards, projects' blocks, a plan
    chest's drawers, a table's grid, a process's steps, a template's page, a flow's piece passing, settings' slides, a connection's
    cloud, the administration's stamp, Nolli's parcels, Zaha's rooms, Blueprint's sheets, Tuval's pen line, Mies's storeys on their
    columns, Render's light and shadow, Sullivan's people at a door, Aldo's money columns, Steilneset's word and its answer. Each
    whole, and small (a few of its parts) for a line and a button; each part's faces at 30 degrees, its delay into the 2.4 s turn
    and where it comes from; the view box framed round them. `SOANE belgeler/iso-motifler-2026-10-23-siza.md` holds which room draws which.
  - `src/iso/index.tsx` (`eemh-design/iso`): `IsoScope` (where a module's screens begin: every drawing under it draws its `motif`;
    outside every scope the building), `IsoLoader` (sizes screen, section, card, fit, row, button; `label` said to a screen
    reader, `said` written, `quiet` inside a wait already said), `IsoFill` (a map's or canvas's whole box), `IsoEmpty` (the drawing
    at rest over its one sentence, with a `title` and an `action`; `size="row"` in a line). None of them takes a motif: a wait
    draws its module's, never one named where it waits. The consumer wraps `IsoLoader` with its own word for "Loading…".
  - `src/iso/dom.ts` (`eemh-design/iso/dom`): the same drawing for a page drawn without React (Mies): `isoSvg(motif, { height,
    small, idle })`, set in the page's own lines (`iso-line`).
  - `src/iso/iso.css` (`eemh-design/iso.css`): the faces in the theme's tones (`--foreground`, `--background`, `--border`, `--brand`,
    each falling back to the text's own colour), a wait unseen under 150 ms, only transform and opacity moving, nothing moving
    under reduced motion.
  `Button` takes `loading`: pressed no more, said busy, its module's small drawing where its icon stood. A consumer names `dist/iso` as a source
  beside `dist/button` (`@source "<path to>/node_modules/eemh-design/dist/iso";`) and imports `eemh-design/iso.css` once.
- `src/view-cube/` (`eemh-design/view-cube`, 23.10.2026, the owner: "renderdaki ve mies deki viewcube farklı. renderdakini baz
  alalım"): Revit's view cube, Render's moved here whole so Render and Mies draw one (three.js an optional peer). `ViewCube` (a
  renderer of its own: the shaded cube seen orthographically, its 26 zones lit under the pointer, the compass ring at its foot;
  `pick`, `orbit` handed back), `cubeLook` (its look from the tokens, the design's own where a host defines none), `cssColor`
  (a token expression as three.js reads it) and `isDark`. It stands in three.js's frame (+Y up, front +Z); a host whose model does
  not turns what it hands it and what it is handed (Mies: +Z up, front -Y).
- `src/lanes/` (v0.8.0, 24.10.2026, ana's decision (a) on the design language's Render row: "İş kuyruğu `TimeLanes` ile"): the
  panel's trace waterfall (the owner's example, 22-23.10.2026), which the panel's cockpit held (`src/panel/cockpit/TimeLanes.tsx`
  and the lane half of `scale.ts`), moved here so the panel's Aldo cockpit and automation room and Render's queue draw one:
  - `src/lanes/scale.ts`: the lane's arithmetic, framework-free (the zoom steps, an axis' round values, the steps its words are
    written at, the deepest a running total goes, the step under a point) and a run's clock: `timed` lays what ran on its run's own
    clock in the first of `STEPS_MS` that holds the whole in `RUN_STEPS` or fewer, `tickOf` writes a tick in that step's one unit
    and `secondsOf` how long something took (the automation room's steps and Render's cameras alike).
  - `src/lanes/index.tsx` (`eemh-design/lanes`): `TimeLanes`, a row for each stretch, its bar where it began for as long as it
    took with its figure beside it, a bar opening its card, one axis zoomed and moved by buttons, Ctrl and the wheel, a drag or the
    keys. The room gives its words (`words`: the axis' name, the strip's, the zoom buttons'; `locale` for the zoom figure) and
    what it draws under the lanes on the same axis (`under`: its steps, its key, its marks in the names' column, itself, and its
    lines in the pointer's readout).
  - `src/lanes/flow.tsx` (`eemh-design/lanes/flow`): `flowUnder`, the Aldo cockpit's money under the lanes (each month's in and
    out, the running total, its deepest point's ring breathing out three times, `--animate-peak`, the panel's `.cockpit-peak`
    until v0.8.0). Apart from the lanes, so a lane drawn without money carries no chart library: `recharts` is needed by this
    file alone.

  It needs `react`, `motion`, `lucide-react` and `radix-ui` from the consumer, and `recharts` for `./lanes/flow` (peer
  dependencies, optional). A consumer names `dist/lanes` as a source beside `dist/button`
  (`@source "<path to>/node_modules/eemh-design/dist/lanes";`).
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

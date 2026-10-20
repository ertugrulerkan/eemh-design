// The contrast gate: every text pair the consumers draw (tokens/pairs.json) reads at 4.5 : 1 in both themes (ui-rules A5), and the
// pairs they must not draw fall under it, so a token change that breaks a consumer's text fails here, not on its screen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { declarations, oklch, ratio, resolve, shown } from "../scripts/contrast.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pairs = JSON.parse(readFileSync(path.join(root, "tokens", "pairs.json"), "utf8"));
const THEMES = ["light", "dark"];

/** The pair's contrast in a theme: the surface over the page's own background, the text over the surface. */
function contrast([fg, bg], theme) {
  const decl = declarations(theme);
  const page = shown("background", decl, [1, 1, 1, 1]);
  const surface = shown(bg, decl, page);
  return ratio(shown(fg, decl, surface), surface);
}

test("the colours are read as a browser shows them", () => {
  const day = declarations("light");
  const hex = (c) => c.slice(0, 3).map((x) => Math.round(255 * (x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055)));
  // the neutral scale's own sRGB values, and the 04.10 audit's white on the accent (2.75 by day, 2.46 by night)
  assert.deepEqual(hex(resolve("oklch(0.985 0 0)", day)), [250, 250, 250]);
  assert.deepEqual(hex(resolve("oklch(0.556 0 0)", day)), [115, 115, 115]);
  assert.equal(ratio(resolve("#fff", day), resolve("var(--rail-blue)", day)).toFixed(2), "2.75");
  assert.equal(ratio(resolve("#fff", day), resolve("var(--rail-blue)", declarations("dark"))).toFixed(2), "2.46");
  // a mix with transparent keeps its colour and thins its alpha
  const overlay = resolve("var(--hover-overlay)", day);
  assert.ok(Math.abs(overlay[3] - 0.08) < 1e-9);
});

test("a hue written in oklch() mixes as the browser mixes it, a neutral's 0 too", () => {
  const day = declarations("light");
  const same = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-4);
  // Chromium 141's computed values: the neutral's written hue 0 pulls the mix to 305; none and a converted black are missing
  const mixed = (other) => resolve(`color-mix(in oklch, oklch(0.6 0.15 250) 50%, ${other} 50%)`, day);
  assert.ok(same(mixed("oklch(0.145 0 0)"), resolve("oklch(0.3725 0.075 305)", day)));
  assert.ok(same(mixed("oklch(0.145 0 none)"), resolve("oklch(0.3725 0.075 250)", day)));
  assert.ok(same(mixed("black"), resolve("oklch(0.3 0.075 250)", day)));
});

// An ink or a weak tint is its colour pulled toward a neutral: mixed in oklch, the neutral's written hue 0 turned the success ink
// brown and its band pink (20.10), so each keeps the hue of the colour it is made of.
for (const theme of THEMES) {
  test(`every derived mix of a colour with a neutral keeps the colour's hue by ${theme === "light" ? "day" : "night"}`, () => {
    const decl = declarations(theme);
    const turned = [];
    for (const [name, value] of Object.entries(JSON.parse(readFileSync(path.join(root, "tokens", "derived.json"), "utf8")))) {
      const sides = [...value.matchAll(/var\((--[a-z0-9-]+)\)/g)].map(([use]) => oklch(resolve(use, decl)));
      const hued = sides.filter(([, chroma]) => chroma > 0.02);
      if (sides.length !== 2 || hued.length !== 1 || !sides.some(([, chroma]) => chroma < 1e-6)) continue;
      const [, , hue] = oklch(resolve(`var(${name})`, decl));
      const off = Math.abs(((hue - hued[0][2] + 540) % 360) - 180);
      if (off > 1) turned.push(`${name}: hue ${hue.toFixed(1)}, its colour's ${hued[0][2].toFixed(1)}`);
    }
    assert.deepEqual(turned, []);
  });
}

test("the gate covers at least 40 text pairs, every token of them defined", () => {
  assert.ok(pairs.text.length >= 40, `${pairs.text.length} pairs`);
  for (const [fg, bg] of [...pairs.text, ...pairs.misuse, ...pairs.marks]) for (const theme of THEMES) assert.doesNotThrow(() => contrast([fg, bg], theme), `${fg} on ${bg}`);
});

for (const theme of THEMES) {
  test(`every text pair reads at 4.5 : 1 by ${theme === "light" ? "day" : "night"}`, () => {
    const failing = pairs.text.map((p) => [p, contrast(p, theme)]).filter(([, r]) => r < 4.5);
    assert.deepEqual(failing.map(([[fg, bg, where], r]) => `${fg} on ${bg} (${where}): ${r.toFixed(2)}`), []);
  });
}

// A mark is an edge, not words (WCAG 1.4.11): Tuval's layer swatch keeps the drawing's own colour, AutoCAD's yellow at 1.07 : 1 on
// white among them, so its ring is what is seen against the ground, on the themes' pages and on the grounds AutoCAD's colours
// are read against (white and #1a1a1a: 13c D3).
for (const theme of THEMES) {
  test(`every mark stands at 3 : 1 against its ground by ${theme === "light" ? "day" : "night"}`, () => {
    const failing = pairs.marks.map((p) => [p, contrast(p, theme)]).filter(([, r]) => r < 3);
    assert.deepEqual(failing.map(([[fg, bg, where], r]) => `${fg} on ${bg} (${where}): ${r.toFixed(2)}`), []);
  });
}

test("the swatch ring stands at 3 : 1 on white by day and on #1a1a1a by night", () => {
  const ring = (theme, ground) => ratio(resolve("var(--muted-foreground)", declarations(theme)), resolve(ground, declarations(theme)));
  assert.ok(ring("light", "#fff") >= 3, `day ${ring("light", "#fff").toFixed(2)}`);
  assert.ok(ring("dark", "#1a1a1a") >= 3, `night ${ring("dark", "#1a1a1a").toFixed(2)}`);
});

test("every pair a consumer must not draw falls under 4.5 : 1 in a theme: the gate fails on them", () => {
  const passing = pairs.misuse.filter((p) => THEMES.every((theme) => contrast(p, theme) >= 4.5));
  assert.deepEqual(passing.map(([fg, bg, where]) => `${fg} on ${bg} (${where})`), []);
});

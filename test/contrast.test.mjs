// The contrast gate: every text pair the consumers draw (tokens/pairs.json) reads at 4.5 : 1 in both themes (ui-rules A5), and the
// pairs they must not draw fall under it, so a token change that breaks a consumer's text fails here, not on its screen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { declarations, ratio, resolve, shown } from "../scripts/contrast.mjs";

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

test("the gate covers at least 40 text pairs, every token of them defined", () => {
  assert.ok(pairs.text.length >= 40, `${pairs.text.length} pairs`);
  for (const [fg, bg] of [...pairs.text, ...pairs.misuse]) for (const theme of THEMES) assert.doesNotThrow(() => contrast([fg, bg], theme), `${fg} on ${bg}`);
});

for (const theme of THEMES) {
  test(`every text pair reads at 4.5 : 1 by ${theme === "light" ? "day" : "night"}`, () => {
    const failing = pairs.text.map((p) => [p, contrast(p, theme)]).filter(([, r]) => r < 4.5);
    assert.deepEqual(failing.map(([[fg, bg, where], r]) => `${fg} on ${bg} (${where}): ${r.toFixed(2)}`), []);
  });
}

test("every pair a consumer must not draw falls under 4.5 : 1 in a theme: the gate fails on them", () => {
  const passing = pairs.misuse.filter((p) => THEMES.every((theme) => contrast(p, theme) >= 4.5));
  assert.deepEqual(passing.map(([fg, bg, where]) => `${fg} on ${bg} (${where})`), []);
});

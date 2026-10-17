// Every value in tokens/ must be a syntactically plausible CSS value, and
// scale token names must never collide with an existing colour/theme name.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function readJson(name) {
  return JSON.parse(readFileSync(path.join(root, "tokens", name), "utf8"));
}

const color = readJson("color.json");
const theme = readJson("theme.json");
const scale = readJson("scale.json");
const derived = readJson("derived.json");

function isBalanced(value) {
  let depth = 0;
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

function allValues() {
  return [
    ...Object.entries(color.light).map(([name, value]) => [`color.light.${name}`, value]),
    ...Object.entries(color.dark).map(([name, value]) => [`color.dark.${name}`, value]),
    ...Object.entries(theme).map(([name, value]) => [`theme.${name}`, value]),
    ...Object.entries(scale).map(([name, value]) => [`scale.${name}`, value]),
    ...Object.entries(derived).map(([name, value]) => [`derived.${name}`, value]),
  ];
}

test("every token value has balanced parentheses", () => {
  for (const [key, value] of allValues()) {
    assert.ok(isBalanced(value), `${key}: unbalanced parentheses in ${JSON.stringify(value)}`);
  }
});

test("every token value has no trailing semicolon", () => {
  for (const [key, value] of allValues()) {
    assert.ok(!value.trim().endsWith(";"), `${key}: trailing semicolon in ${JSON.stringify(value)}`);
  }
});

test("every token value is non-empty", () => {
  for (const [key, value] of allValues()) {
    assert.ok(value.trim().length > 0, `${key}: empty value`);
  }
});

test("scale token names never collide with a colour or theme name", () => {
  const existing = new Set([
    ...Object.keys(color.light),
    ...Object.keys(color.dark),
    ...Object.keys(theme),
  ]);
  for (const name of Object.keys(scale)) {
    assert.ok(!existing.has(name), `scale token ${name} collides with an existing colour/theme name`);
  }
});

test("derived token names never collide, and mix only colour tokens both themes define", () => {
  const existing = new Set([...Object.keys(color.light), ...Object.keys(color.dark), ...Object.keys(theme), ...Object.keys(scale)]);
  for (const [name, value] of Object.entries(derived)) {
    assert.ok(!existing.has(name), `derived token ${name} collides with an existing name`);
    assert.match(value, /^color-mix\(/, `${name}: a derived token is a color-mix() of tokens`);
    for (const [, used] of value.matchAll(/var\((--[a-z0-9-]+)\)/g))
      assert.ok(used in color.light && used in color.dark, `${name} mixes ${used}, which is not a colour token of both themes`);
  }
});

test("every night colour has a day value, so .light inside a .dark page takes each one back", () => {
  for (const name of Object.keys(color.dark)) assert.ok(name in color.light, `${name} is set for night only`);
});

// A color-mix() whose two percentages add up to less than 100% comes out partly transparent (CSS Color 5): an overlay says so
// with `transparent`, a solid shade must add up to 100%. --popover-hover (80% + 12%, 92% opaque) waits on the owner's call.
const partlyTransparentAsDrawn = new Set(["--popover-hover"]);

test("a derived mix of two colours adds up to 100% unless it mixes with transparent", () => {
  for (const [name, value] of Object.entries(derived)) {
    if (value.includes("transparent") || partlyTransparentAsDrawn.has(name)) continue;
    const shares = [...value.matchAll(/(\d+(?:\.\d+)?)%/g)].map(([, share]) => Number(share));
    if (shares.length === 2) assert.equal(shares[0] + shares[1], 100, `${name}: ${value} adds up to less than 100%`);
  }
});

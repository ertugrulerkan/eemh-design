// The view cube (src/view-cube): the zones it turns the camera to, and the look's fallbacks the design's own tokens.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Vector3 } from "three";
import { CUBE_TOKENS, cubeLook, cubeZone } from "../dist/view-cube/index.js";

const tokens = (name) => JSON.parse(readFileSync(new URL(`../tokens/${name}`, import.meta.url), "utf8"));

test("a point on the cube is the zone it stands in: its face's middle, an edge's strip, a corner's square (Revit's 26)", () => {
  const zone = (x, y, z) => cubeZone(new Vector3(x, y, z)).toArray();
  assert.deepEqual(zone(0, 0, 1), [0, 0, 1]);
  assert.deepEqual(zone(0.9, 0, 1), [1, 0, 1]);
  assert.deepEqual(zone(0.9, -0.8, 1), [1, -1, 1]);
  assert.deepEqual(zone(-1, 0.1, 0.3), [-1, 0, 0]);
});

test("the cube's look falls back to the design's own tokens, day and night, where its host defines none", () => {
  const color = tokens("color.json");
  for (const theme of ["light", "dark"]) {
    const own = CUBE_TOKENS[theme];
    assert.equal(own.card, color[theme]["--card"]);
    assert.equal(own.foreground, color[theme]["--foreground"]);
    assert.equal(own.border, color[theme]["--border"]);
    assert.equal(own.brand, color[theme]["--brand"]);
  }
  // the strong border is the design's own mix, as derived.json writes it
  assert.match(tokens("derived.json")["--border-strong"], /^color-mix\(in oklch,var\(--border\) 45%,var\(--foreground\) 55%\)$/);
  const seen = [];
  const look = cubeLook({
    dark: false,
    labels: { front: "FRONT", back: "BACK", left: "LEFT", right: "RIGHT", top: "TOP", bottom: "BOTTOM" },
    compass: { n: "N", e: "E", s: "S", w: "W" },
    resolve: (css) => (seen.push(css), css),
  });
  assert.equal(look.size, 116);
  assert.equal(look.hover, "var(--brand, #ff4c00)");
  assert.ok(look.edge.startsWith("var(--border-strong, color-mix(in oklch, var(--border, oklch(0.922 0 0)) 45%"));
  assert.ok(seen.every((css) => css.includes("var(--")));
});

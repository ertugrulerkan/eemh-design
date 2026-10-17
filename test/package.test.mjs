// What a consumer imports: every package.json export names a file dist/ ships, and tokens.d.ts declares exactly what
// tokens.js exports.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

function targets(entry) {
  return typeof entry === "string" ? [entry] : Object.values(entry).flatMap(targets);
}

test("every export names a file inside the shipped dist/", () => {
  for (const [subpath, entry] of Object.entries(pkg.exports)) {
    for (const target of targets(entry)) {
      assert.ok(target.startsWith("./dist/") && pkg.files.includes("dist"), `${subpath} -> ${target} is outside "files"`);
      assert.ok(existsSync(path.join(root, target)), `${subpath} -> ${target} does not exist`);
    }
  }
});

test("tokens.d.ts declares exactly the names tokens.js exports", async () => {
  const js = await import(path.join(root, "dist", "tokens.js"));
  const dts = readFileSync(path.join(root, "dist", "tokens.d.ts"), "utf8");
  const declared = [...dts.matchAll(/export declare const (\w+)/g)].map(([, name]) => name).sort();
  assert.deepEqual(declared, Object.keys(js).sort());
});

// scripts/compare-panel.mjs: zero differences for a panel.css that holds the same tokens as dist/, and a refusal (exit 2)
// for one that imports eemh-design instead of holding its own copy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const script = path.join(root, "scripts", "compare-panel.mjs");

function readJson(name) {
  return JSON.parse(readFileSync(path.join(root, "tokens", name), "utf8"));
}

function block(selector, props) {
  return `${selector} {\n${Object.entries(props).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}\n`;
}

function compare(css) {
  const work = mkdtempSync(path.join(tmpdir(), "eemh-design-compare-"));
  try {
    const file = path.join(work, "panel.css");
    writeFileSync(file, css);
    return spawnSync(process.execPath, [script, file], { encoding: "utf8" });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

test("a panel.css holding the same tokens as dist/ compares with zero differences", () => {
  const color = readJson("color.json");
  const css = block(":root", color.light) + block(".dark", color.dark) + block("@theme inline", readJson("theme.json"));
  const run = compare(css);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /zero differences/);
});

test("a panel.css that imports eemh-design is refused instead of diffed", () => {
  for (const line of ['@import "eemh-design/tokens.css";', "@import url('eemh-design/theme.css');"]) {
    const run = compare(`${line}\n:root {\n  --zaha-paper: white;\n}\n`);
    assert.equal(run.status, 2, `${line}: ${run.stdout}${run.stderr}`);
    assert.match(run.stderr, /imports eemh-design itself/);
    assert.equal(run.stdout, "");
  }
});

// Fails if the committed dist/ has drifted from what scripts/build.mjs writes from tokens/ (and src/iso/iso.css).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test("dist/ matches a fresh build from tokens/", () => {
  const work = mkdtempSync(path.join(tmpdir(), "eemh-design-build-"));
  try {
    cpSync(path.join(root, "tokens"), path.join(work, "tokens"), { recursive: true });
    cpSync(path.join(root, "scripts"), path.join(work, "scripts"), { recursive: true });
    cpSync(path.join(root, "src", "iso", "iso.css"), path.join(work, "src", "iso", "iso.css"));
    execFileSync(process.execPath, [path.join(work, "scripts", "build.mjs")]);

    for (const name of ["tokens.css", "theme.css", "tokens.js", "tokens.d.ts", "iso.css"]) {
      const committed = readFileSync(path.join(root, "dist", name), "utf8");
      const fresh = readFileSync(path.join(work, "dist", name), "utf8");
      assert.equal(committed, fresh, `dist/${name} differs from a fresh build`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// every compiled file under a directory (its .js and .d.ts), by its path within it
const compiled = (dir) => readdirSync(dir, { recursive: true }).map(String).filter((name) => /\.(js|d\.ts)$/.test(name)).sort();

test("dist/'s code matches a fresh compile of src/, every module of it, and holds none the source no longer makes", () => {
  // each file the compile writes, never a list kept by hand (28.10.2026: the view cube's and the time lanes' were not on it, and a
  // source change to them left dist/ stale with this test passing)
  const work = mkdtempSync(path.join(tmpdir(), "eemh-design-tsc-"));
  try {
    execFileSync(process.execPath, [path.join(root, "node_modules", "typescript", "bin", "tsc"), "-p", path.join(root, "tsconfig.json"), "--outDir", work]);
    const fresh = compiled(work);
    assert.ok(fresh.includes(path.join("view-cube", "index.js")) && fresh.includes(path.join("lanes", "scale.js")));
    for (const name of fresh) {
      const committed = readFileSync(path.join(root, "dist", name), "utf8");
      assert.equal(committed, readFileSync(path.join(work, name), "utf8"), `dist/${name} differs from a fresh compile`);
    }
    // what scripts/build.mjs writes from tokens/ beside the compile, read by the test above
    const built = new Set(["tokens.js", "tokens.d.ts"]);
    const left = compiled(path.join(root, "dist")).filter((name) => !fresh.includes(name) && !built.has(name));
    assert.deepEqual(left, [], "dist/ holds code no source makes");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// Fails if the committed dist/ has drifted from what scripts/build.mjs writes from tokens/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test("dist/ matches a fresh build from tokens/", () => {
  const work = mkdtempSync(path.join(tmpdir(), "eemh-design-build-"));
  try {
    cpSync(path.join(root, "tokens"), path.join(work, "tokens"), { recursive: true });
    cpSync(path.join(root, "scripts"), path.join(work, "scripts"), { recursive: true });
    execFileSync(process.execPath, [path.join(work, "scripts", "build.mjs")]);

    for (const name of ["tokens.css", "theme.css", "tokens.js", "tokens.d.ts"]) {
      const committed = readFileSync(path.join(root, "dist", name), "utf8");
      const fresh = readFileSync(path.join(work, "dist", name), "utf8");
      assert.equal(committed, fresh, `dist/${name} differs from a fresh build`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

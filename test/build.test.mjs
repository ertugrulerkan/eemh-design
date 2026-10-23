// Fails if the committed dist/ has drifted from what scripts/build.mjs writes from tokens/ (and src/iso/iso.css).
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

test("dist/'s code matches a fresh compile of src/", () => {
  const work = mkdtempSync(path.join(tmpdir(), "eemh-design-tsc-"));
  try {
    execFileSync(process.execPath, [path.join(root, "node_modules", "typescript", "bin", "tsc"), "-p", path.join(root, "tsconfig.json"), "--outDir", work]);
    for (const name of ["button/index", "button/registry/motion/button/base", "button/registry/lib/ease", "button/registry/lib/utils", "button/registry/lib/hooks/use-hover-capable", "vite/index", "iso/index", "iso/geometry", "iso/dom"]
      .flatMap((file) => [`${file}.js`, `${file}.d.ts`])) {
      const committed = readFileSync(path.join(root, "dist", name), "utf8");
      const fresh = readFileSync(path.join(work, name), "utf8");
      assert.equal(committed, fresh, `dist/${name} differs from a fresh compile`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

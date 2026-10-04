#!/usr/bin/env node
// Parses a panel.css, resolves the final value of every custom property in its
// top-level :root and .dark scopes and every declaration of its @theme inline
// block, and compares them against this package's dist/tokens.css and
// dist/theme.css. Usage: node scripts/compare-panel.mjs <path to panel.css>
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const panelPath = process.argv[2];
if (!panelPath) {
  console.error("usage: node scripts/compare-panel.mjs <path to panel.css>");
  process.exit(2);
}

// Strips /* ... */ comments so they never interfere with brace matching.
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

// Splits top-level rules of a stylesheet into { selector, body } pairs,
// tracking brace depth so nested rules (e.g. @theme's @keyframes) stay inside
// their parent's body instead of being split out as their own top-level rule.
function topLevelRules(css) {
  const rules = [];
  let depth = 0;
  let selectorStart = 0;
  let bodyStart = -1;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      if (depth === 0) {
        bodyStart = i + 1;
      }
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const selector = css.slice(selectorStart, bodyStart - 1).trim();
        const body = css.slice(bodyStart, i);
        rules.push({ selector, body });
        selectorStart = i + 1;
      }
    } else if (ch === ";" && depth === 0) {
      // A bodyless statement (@import, @custom-variant, ...): not a rule, just
      // skip past it so it never leaks into the next rule's selector text.
      selectorStart = i + 1;
    }
  }
  return rules;
}

// Extracts top-level custom-property declarations (`--name: value;`) from a
// rule body, ignoring anything nested inside braces (e.g. @keyframes).
function declarations(body) {
  const decls = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        // A nested block (e.g. @keyframes) ends a statement without a ';'.
        const decl = body.slice(start, i + 1).trim();
        if (decl) decls.push(decl);
        start = i + 1;
      }
    } else if (ch === ";" && depth === 0) {
      const decl = body.slice(start, i).trim();
      if (decl) decls.push(decl);
      start = i + 1;
    }
  }
  const tail = body.slice(start).trim();
  if (tail) decls.push(tail);

  const props = [];
  for (const decl of decls) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const name = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (name.startsWith("--")) props.push([name, value]);
  }
  return props;
}

// Resolves custom properties declared across every rule whose selector is
// exactly `match` (":root" or ".dark"), in order of first appearance,
// last declaration in source order wins.
function resolveScope(rules, match) {
  const order = [];
  const values = new Map();
  for (const rule of rules) {
    if (rule.selector !== match) continue;
    for (const [name, value] of declarations(rule.body)) {
      if (!values.has(name)) order.push(name);
      values.set(name, value);
    }
  }
  const result = {};
  for (const name of order) result[name] = values.get(name);
  return result;
}

function resolveTheme(rules) {
  const result = {};
  for (const rule of rules) {
    if (rule.selector !== "@theme inline") continue;
    for (const [name, value] of declarations(rule.body)) {
      result[name] = value;
    }
  }
  return result;
}

function parseCssBlock(css, selector) {
  const rules = topLevelRules(stripComments(css));
  const rule = rules.find((r) => r.selector === selector);
  const result = {};
  if (!rule) return result;
  for (const [name, value] of declarations(rule.body)) result[name] = value;
  return result;
}

const panelCss = readFileSync(panelPath, "utf8");
const panelRules = topLevelRules(stripComments(panelCss));

const panelRoot = resolveScope(panelRules, ":root");
const panelDark = resolveScope(panelRules, ".dark");
const panelTheme = resolveTheme(panelRules);

const distTokensCss = readFileSync(path.join(root, "dist", "tokens.css"), "utf8");
const distThemeCss = readFileSync(path.join(root, "dist", "theme.css"), "utf8");
const distRoot = parseCssBlock(distTokensCss, ":root");
const distDark = parseCssBlock(distTokensCss, ".dark");
const distTheme = parseCssBlock(distThemeCss, "@theme inline");

// New scale-only properties never claim to reproduce panel.css; ignore them.
const scaleNames = new Set(
  Object.keys(JSON.parse(readFileSync(path.join(root, "tokens", "scale.json"), "utf8")))
);

function diffScope(label, panelValues, distValues) {
  const diffs = [];
  const names = new Set([...Object.keys(panelValues), ...Object.keys(distValues)]);
  for (const name of names) {
    if (scaleNames.has(name)) continue;
    const inPanel = name in panelValues;
    const inDist = name in distValues;
    if (inPanel && !inDist) {
      diffs.push(`${label} ${name}: missing from dist (panel has ${JSON.stringify(panelValues[name])})`);
    } else if (!inPanel && inDist) {
      diffs.push(`${label} ${name}: extra in dist (${JSON.stringify(distValues[name])}), not in panel`);
    } else if (panelValues[name] !== distValues[name]) {
      diffs.push(
        `${label} ${name}: different value — panel ${JSON.stringify(panelValues[name])} vs dist ${JSON.stringify(distValues[name])}`
      );
    }
  }
  return diffs;
}

const diffs = [
  ...diffScope(":root", panelRoot, distRoot),
  ...diffScope(".dark", panelDark, distDark),
  ...diffScope("@theme inline", panelTheme, distTheme),
];

if (diffs.length === 0) {
  console.log("compare-panel: zero differences");
  console.log(
    `  :root: ${Object.keys(panelRoot).length} properties, .dark: ${Object.keys(panelDark).length} properties, @theme inline: ${Object.keys(panelTheme).length} declarations`
  );
  process.exit(0);
} else {
  console.log(`compare-panel: ${diffs.length} difference(s)`);
  for (const d of diffs) console.log(`  - ${d}`);
  process.exit(1);
}

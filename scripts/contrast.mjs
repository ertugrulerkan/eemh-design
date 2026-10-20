// The tokens as colours a screen shows, and WCAG 2 contrast between them: oklch(), #hex, rgb(), black/white/transparent and
// color-mix() (CSS Color 5: in oklch, oklab or srgb; a side's percentage taken from the other's, a sum under 100% thinning
// the alpha; transparent mixed premultiplied) over var() references, resolved per theme the way dist/tokens.css scopes them:
// day is :root, night is .dark over :root (a day-only token reaches the night), the mixes in both.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (name) => JSON.parse(readFileSync(path.join(root, "tokens", name), "utf8"));

/** The declarations of a theme ("light" or "dark"), by custom property name. */
export function declarations(theme, tokens = { color: read("color.json"), derived: read("derived.json") }) {
  const { color, derived } = tokens;
  return theme === "dark" ? { ...color.light, ...color.dark, ...derived } : { ...color.light, ...derived };
}

// ---- colour spaces: a colour is [r, g, b, alpha] in linear sRGB (unclipped until it is shown)

const srgbToLinear = (c) => (Math.abs(c) <= 0.04045 ? c / 12.92 : Math.sign(c) * ((Math.abs(c) + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (Math.abs(c) <= 0.0031308 ? c * 12.92 : Math.sign(c) * (1.055 * Math.abs(c) ** (1 / 2.4) - 0.055));

function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const toLch = ([L, a, b]) => [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
const fromLch = ([L, C, H]) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];

// ---- parsing

const number = (s, whole = 1) => (s.endsWith("%") ? (parseFloat(s) / 100) * whole : parseFloat(s));

function splitTop(s, sep = ",") {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    else if (s[i] === sep && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  }
  out.push(s.slice(start).trim());
  return out;
}

/** A token's value as a colour, its var() references read from `decl` (a theme's declarations). */
export function resolve(value, decl, seen = new Set()) {
  const v = value.trim();
  const call = /^([a-z-]+)\((.*)\)$/s.exec(v);
  if (/^var\(/.test(v)) {
    const name = /^var\(\s*(--[\w-]+)\s*\)$/.exec(v)?.[1];
    if (!name || !(name in decl)) throw new Error(`no token ${v}`);
    if (seen.has(name)) throw new Error(`${name} refers to itself`);
    return resolve(decl[name], decl, new Set([...seen, name]));
  }
  if (v === "transparent") return [0, 0, 0, 0];
  if (v === "black") return [0, 0, 0, 1];
  if (v === "white") return [1, 1, 1, 1];
  if (v.startsWith("#")) {
    const h = v.slice(1);
    const full = h.length <= 4 ? [...h].map((c) => c + c).join("") : h;
    const n = (i) => parseInt(full.slice(i, i + 2), 16) / 255;
    return [srgbToLinear(n(0)), srgbToLinear(n(2)), srgbToLinear(n(4)), full.length === 8 ? n(6) : 1];
  }
  if (!call) throw new Error(`not a colour: ${v}`);
  const [, fn, args] = call;
  if (fn === "oklch" || fn === "rgb" || fn === "rgba") {
    const [channels, alpha] = args.includes("/") ? args.split("/").map((p) => p.trim()) : [args, "1"];
    const c = channels.split(/[\s,]+/).filter(Boolean);
    const a = number(alpha);
    // the hue written in oklch() stays the colour's own, a powerless one too (oklch(0.145 0 0) mixes in oklch with hue 0); none is missing
    if (fn === "oklch") {
      const hue = c[2] === "none" ? null : parseFloat(c[2]);
      return Object.assign([...oklabToLinear(fromLch([number(c[0]), number(c[1], 0.4), hue ?? 0])), a], { hue });
    }
    return [...c.slice(0, 3).map((x) => srgbToLinear(number(x, 255) / 255)), c.length > 3 ? number(c[3]) : a];
  }
  if (fn === "color-mix") return mix(args, decl, seen);
  throw new Error(`not a colour: ${v}`);
}

function mix(args, decl, seen) {
  const [space, ...sides] = splitTop(args);
  const where = /^in\s+(oklch|oklab|srgb)$/.exec(space)?.[1];
  if (!where || sides.length !== 2) throw new Error(`color-mix not read: ${args}`);
  const parts = sides.map((side) => {
    const m = /^(.*?)\s+([\d.]+%)$/s.exec(side);
    return m ? { colour: resolve(m[1], decl, seen), p: parseFloat(m[2]) / 100 } : { colour: resolve(side, decl, seen), p: null };
  });
  let [p1, p2] = parts.map((x) => x.p);
  if (p1 === null && p2 === null) p1 = p2 = 0.5;
  else if (p1 === null) p1 = 1 - p2;
  else if (p2 === null) p2 = 1 - p1;
  const sum = p1 + p2;
  const [w1, w2] = [p1 / sum, p2 / sum];
  const [a, b] = parts.map((x) => x.colour);
  const alpha = a[3] * w1 + b[3] * w2;
  const coords = (c) => (where === "srgb" ? c.slice(0, 3).map(linearToSrgb) : where === "oklab" ? linearToOklab(c) : toLch(linearToOklab(c)));
  let [ca, cb] = [coords(a), coords(b)];
  // a side's hue is the one its oklch() wrote, even at chroma 0, as browsers mix it (Chromium 141: oklch(0.6 0.15 250) and
  // oklch(0.145 0 0) half and half come out at hue 305); a colour converted from another space has none when it is achromatic,
  // transparent and black among them, and a missing hue takes the other side's (CSS Color 4, missing components)
  const hues = where === "oklch" ? [[a, ca], [b, cb]].map(([c, lch]) => ("hue" in c ? c.hue : c[3] === 0 || lch[1] < 1e-6 ? null : lch[2])) : [];
  if (where === "oklch") {
    ca[2] = hues[0] ?? hues[1] ?? 0;
    cb[2] = hues[1] ?? hues[0] ?? 0;
  }
  const out = [0, 1, 2].map((i) => {
    if (where === "oklch" && i === 2) {
      let d = cb[2] - ca[2];
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      return ca[2] + d * w2;
    }
    // premultiplied by alpha, then divided again (CSS Color 4 interpolation)
    return alpha === 0 ? 0 : (ca[i] * a[3] * w1 + cb[i] * b[3] * w2) / alpha;
  });
  const linear = where === "srgb" ? out.map(srgbToLinear) : where === "oklab" ? oklabToLinear(out) : oklabToLinear(fromLch(out));
  const mixed = [...linear, alpha * Math.min(1, sum)];
  // a mix in oklch is an oklch colour: its hue is its own when it is mixed again
  return where === "oklch" ? Object.assign(mixed, { hue: hues[0] === null && hues[1] === null ? null : out[2] }) : mixed;
}

/** A colour's oklch lightness, chroma and hue, the hue its oklch() wrote when it was written so. */
export function oklch(colour) {
  const lch = toLch(linearToOklab(colour));
  return colour.hue == null ? lch : [lch[0], lch[1], colour.hue];
}

// ---- what a screen shows, and contrast

/** The colour shown: clipped to sRGB, `top` laid over `under` by its alpha (in sRGB values, as browsers blend). */
export function over(top, under) {
  const clip = (c) => Math.min(1, Math.max(0, linearToSrgb(c)));
  const t = top.slice(0, 3).map(clip), u = under.slice(0, 3).map(clip);
  const a = top[3];
  return [...t.map((c, i) => srgbToLinear(c * a + u[i] * (1 - a))), 1];
}

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** WCAG 2 contrast ratio of two opaque colours. */
export function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** A token name with an optional Tailwind alpha ("brand/10", "brand/[0.06]") as the colour it shows over `under`. */
export function shown(name, decl, under) {
  const [token, alphaText] = name.split("/");
  const colour = resolve(`var(--${token})`, decl);
  const alpha = alphaText === undefined ? 1 : alphaText.startsWith("[") ? parseFloat(alphaText.slice(1, -1)) : parseFloat(alphaText) / 100;
  return over([...colour.slice(0, 3), colour[3] * alpha], under);
}

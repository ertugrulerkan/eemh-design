// The isometric drawings every wait and empty place shows (./iso, ./iso/dom): one geometry, drawn by React and without it alike;
// a wait said once; an empty place at rest over its sentence; a button at work its block.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CYCLE, ISO_MOTIFS, IsoEmpty, IsoLoader, IsoScope, isoDrawing } from "eemh-design/iso";
import { Button } from "eemh-design/button";

// every motif, whole and in its small form (a line's, a button's)
const DRAWINGS = ISO_MOTIFS.flatMap((motif) => [[motif, false], [motif, true]]);

test("every motif is a view box and its parts, each part three faces, already moving as the drawing appears", () => {
  for (const [motif, small] of DRAWINGS) {
    const name = `${motif}${small ? " (small)" : ""}`;
    const { view, parts } = isoDrawing(motif, small);
    const box = view.split(" ").map(Number);
    assert.equal(box.filter(Number.isFinite).length, 4, name);
    assert.ok(box[2] > 0 && box[3] > 0, name);
    assert.ok(parts.length > 0, name);
    for (const part of parts) {
      assert.deepEqual(part.faces.map((face) => face.side), ["side-y", "side-x", "top"], name);
      for (const face of part.faces) assert.equal(face.points.split(" ").length, 4, name);
      // a turn back at most: -CYCLE is the turn's start, as 0 is
      if (part.delay !== undefined) assert.ok(part.delay <= 0 && part.delay >= -CYCLE, `${name}: ${part.delay}`);
    }
    // the work's own piece is edged in the brand, once
    assert.equal(parts.flatMap((part) => part.faces).filter((face) => face.edge).length, 1, name);
    // something in it moves: a drawing standing still is no wait
    assert.ok(parts.some((part) => part.motion !== "plate"), name);
    assert.equal(isoDrawing(motif, small), isoDrawing(motif, small));
  }
});

test("no two modules draw the same: every motif's drawing, whole and small, is its own (the owner, 23.10.2026: 'hepsi farklı')", () => {
  const seen = new Map();
  for (const [motif, small] of DRAWINGS) {
    const { parts } = isoDrawing(motif, small);
    const drawn = JSON.stringify(parts.map((part) => [part.motion, part.faces.map((face) => face.points)]));
    assert.equal(seen.get(drawn), undefined, `${motif}${small ? " (small)" : ""} draws ${seen.get(drawn)}'s drawing`);
    seen.set(drawn, `${motif}${small ? " (small)" : ""}`);
  }
  // the small form is a few of the whole's kind, never more than the whole
  for (const motif of ISO_MOTIFS) assert.ok(isoDrawing(motif, true).parts.length <= isoDrawing(motif).parts.length, motif);
});

test("a wait and an empty place draw the motif of the module they stand in, a line's and a button's its small form", () => {
  const polygons = (html) => html.match(/<polygon class="[^"]+" points="[^"]+"/g);
  const faces = (motif, small) => isoDrawing(motif, small).parts.flatMap((part) => part.faces.map((face) => face.points));
  const pointsOf = (html) => polygons(html).map((one) => one.match(/points="([^"]+)"/)[1]);
  // outside every module: the product's own building
  assert.deepEqual(pointsOf(renderToStaticMarkup(h(IsoLoader, { label: "Loading…" }))), faces("building", false));
  for (const motif of ["rooms", "ledger", "crowd"]) {
    const within = (child) => renderToStaticMarkup(h(IsoScope, { motif }, child));
    assert.deepEqual(pointsOf(within(h(IsoLoader, { label: "Loading…" }))), faces(motif, false), motif);
    assert.deepEqual(pointsOf(within(h(IsoLoader, { size: "row", quiet: true }))), faces(motif, true), motif);
    assert.deepEqual(pointsOf(within(h(IsoEmpty, { title: "Nothing yet" }))), faces(motif, false), motif);
    assert.deepEqual(pointsOf(within(h(IsoEmpty, { size: "row" }, "Nothing yet."))), faces(motif, true), motif);
    assert.deepEqual(pointsOf(within(h(Button, { loading: true }, "Save"))), faces(motif, true), motif);
  }
});

test("a wait is unseen under 150 ms and nothing moves under reduced motion: iso.css holds it back and keeps every motion asked", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../dist/iso.css", import.meta.url), "utf8");
  const moving = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference)"), css.indexOf("@keyframes"));
  assert.match(moving, /\.iso-wait \{ animation: iso-show [^;]* 0\.15s both; \}/);
  // every animation the drawing runs is inside the no-preference block
  assert.equal(css.split("animation:").length - 1, moving.split("animation:").length - 1);
});

test("a wait is said once: its label to a screen reader, its words where shown, nothing where one of several", () => {
  const said = renderToStaticMarkup(h(IsoLoader, { label: "Loading…" }));
  assert.match(said, /^<span role="status" class="iso-wait /);
  assert.match(said, /<span class="sr-only">Loading…<\/span>/);
  assert.match(said, /<svg viewBox="[^"]+" aria-hidden="true" class="iso /);
  const shown = renderToStaticMarkup(h(IsoLoader, { label: "Loading…", said: "Reading the parcel…" }));
  assert.match(shown, />Reading the parcel…<\/span>/);
  assert.doesNotMatch(shown, /sr-only/);
  const quiet = renderToStaticMarkup(h(IsoLoader, { quiet: true, label: "Loading…" }));
  assert.doesNotMatch(quiet, /role=|sr-only/);
  assert.match(quiet, /aria-hidden="true"/);
});

test("an empty place is the drawing at rest over its sentence, its title and its one way to fill it; in a line, its small form", () => {
  const empty = renderToStaticMarkup(h(IsoScope, { motif: "blocks" }, h(IsoEmpty, { title: "No projects yet", action: h("button", null, "New project") }, "A project is a folder.")));
  assert.match(empty, /class="iso shrink-0 overflow-visible iso-idle /);
  assert.match(empty, /<p class="text-\[15px\] font-medium text-foreground">No projects yet<\/p><p [^>]*>A project is a folder\.<\/p><div [^>]*><button>New project<\/button><\/div>/);
  assert.doesNotMatch(empty, /role="status"/);
  const line = renderToStaticMarkup(h(IsoEmpty, { size: "row" }, "No rules yet."));
  assert.match(line, /^<span class="inline-flex items-center gap-2 align-middle"><svg [^>]*class="iso [^"]*iso-idle/);
  assert.match(line, /<span>No rules yet\.<\/span><\/span>$/);
});

test("a button at work is pressed no more, said busy, its block where its icon stood", () => {
  const html = renderToStaticMarkup(h(Button, { loading: true }, "Save"));
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /data-loading=""/);
  assert.match(html, /<span aria-hidden="true" class="iso-wait inline-flex items-center"><svg /);
  const idle = renderToStaticMarkup(h(Button, null, "Save"));
  assert.doesNotMatch(idle, /data-loading|aria-busy|iso-wait| disabled=""/);
});

test("a page without React draws the same drawing: its parts, its classes and its delays", async () => {
  // the few DOM calls ./iso/dom makes, on plain objects
  const make = (tag) => {
    const node = { tag, attrs: {}, children: [], className: "", textContent: "",
      setAttribute(name, value) { this.attrs[name] = value; }, append(...more) { this.children.push(...more); } };
    return node;
  };
  globalThis.document = { createElementNS: (_ns, tag) => make(tag), createElement: (tag) => make(tag) };
  try {
    const { isoSvg } = await import("eemh-design/iso/dom");
    const svg = isoSvg("building", { height: 64 });
    const drawn = isoDrawing("building");
    assert.equal(svg.attrs.viewBox, drawn.view);
    assert.match(svg.attrs.style, /^height: 64px; width: auto;/);
    const parts = svg.children[0].children;
    assert.equal(parts.length, drawn.parts.length);
    assert.deepEqual(parts.map((g) => g.attrs.class), drawn.parts.map((part) => `iso-${part.motion}`));
    assert.equal(parts[1].attrs.style, `animation-delay: ${drawn.parts[1].delay.toFixed(2)}s`);
    // the plate does not move: no style of its own
    assert.equal(parts[0].attrs.style, undefined);
    assert.equal(parts[1].children[2].attrs.points, drawn.parts[1].faces[2].points);
    const resting = isoSvg("storeys", { height: 16, small: true, idle: true });
    assert.equal(resting.attrs.class, "iso iso-idle");
    assert.equal(resting.attrs.viewBox, isoDrawing("storeys", true).view);
    assert.equal(resting.children[0].attrs.class, "iso-float");
    assert.equal(resting.children[0].children.length, isoDrawing("storeys", true).parts.length);
  } finally {
    delete globalThis.document;
  }
});

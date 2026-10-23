// The isometric drawings every wait and empty place shows (./iso, ./iso/dom): one geometry, drawn by React and without it alike;
// a wait said once; an empty place at rest over its sentence; a button at work its block.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CYCLE, IsoEmpty, IsoLoader, isoDrawing } from "eemh-design/iso";
import { Button } from "eemh-design/button";

const MOTIFS = ["building", "sheets", "blocks", "grid", "path", "block"];

test("every motif is a view box and its parts, each part three faces, already moving as the drawing appears", () => {
  for (const motif of MOTIFS) {
    const { view, parts } = isoDrawing(motif);
    assert.equal(view.split(" ").map(Number).filter(Number.isFinite).length, 4, motif);
    assert.ok(parts.length > 0, motif);
    for (const part of parts) {
      assert.deepEqual(part.faces.map((face) => face.side), ["side-y", "side-x", "top"], motif);
      for (const face of part.faces) assert.equal(face.points.split(" ").length, 4, motif);
      // a turn back at most: -CYCLE is the turn's start, as 0 is
      if (part.delay !== undefined) assert.ok(part.delay <= 0 && part.delay >= -CYCLE, `${motif}: ${part.delay}`);
    }
    // the work's own piece is edged in the brand, once
    assert.equal(parts.flatMap((part) => part.faces).filter((face) => face.edge).length, 1, motif);
    assert.equal(isoDrawing(motif), isoDrawing(motif));
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
  // a row's and a button's wait is one block
  assert.equal((renderToStaticMarkup(h(IsoLoader, { size: "row", motif: "grid", quiet: true })).match(/<polygon/g) ?? []).length, 3);
});

test("an empty place is the drawing at rest over its sentence, its title and its one way to fill it; in a line, one block", () => {
  const empty = renderToStaticMarkup(h(IsoEmpty, { motif: "blocks", title: "No projects yet", action: h("button", null, "New project") }, "A project is a folder."));
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
    const node = { tag, attrs: {}, children: [], style: { props: {}, setProperty(name, value) { this.props[name] = value; } }, className: "", textContent: "",
      setAttribute(name, value) { this.attrs[name] = value; }, append(...more) { this.children.push(...more); } };
    return node;
  };
  globalThis.document = { createElementNS: (_ns, tag) => make(tag), createElement: (tag) => make(tag) };
  try {
    const { isoSvg, isoWait, isoEmpty } = await import("eemh-design/iso/dom");
    const svg = isoSvg("building", { height: 64 });
    const drawn = isoDrawing("building");
    assert.equal(svg.attrs.viewBox, drawn.view);
    assert.equal(svg.style.height, "64px");
    const parts = svg.children[0].children;
    assert.equal(parts.length, drawn.parts.length);
    assert.deepEqual(parts.map((g) => g.attrs.class), drawn.parts.map((part) => `iso-${part.motion}`));
    assert.equal(parts[1].style.props["animation-delay"], `${drawn.parts[1].delay.toFixed(2)}s`);
    assert.equal(parts[1].children[2].attrs.points, drawn.parts[1].faces[2].points);
    const wait = isoWait({ motif: "blocks", label: "Saving…" });
    assert.equal(wait.attrs.role, "status");
    assert.equal(wait.children[1].className, "iso-unseen");
    const empty = isoEmpty({ sentence: "No custom properties.", row: true });
    assert.equal(empty.className, "iso-line");
    assert.equal(empty.children[0].attrs.class, "iso iso-idle");
    assert.equal(empty.children[1].textContent, "No custom properties.");
  } finally {
    delete globalThis.document;
  }
});

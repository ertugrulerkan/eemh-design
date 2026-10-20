// The button the panel and Render draw with (./button, v0.3.0): a control's name on one line at 28, a tile as high as it holds with
// its words wrapping, the later class winning, the destructive variant named on the element, beUI's link beside it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, ButtonLink, STILL } from "eemh-design/button";

const classes = (element) => {
  const html = renderToStaticMarkup(element);
  return new Set((/class="([^"]*)"/.exec(html)?.[1] ?? "").split(/\s+/).filter(Boolean));
};

test("a control is 28 high with its name on one line, whatever beUI's own size", () => {
  for (const size of [undefined, "sm", "md", "lg"]) {
    const got = classes(h(Button, { size }, "Open model"));
    assert.ok(got.has("h-7") && got.has("whitespace-nowrap"), `${size ?? "default"}: ${[...got].join(" ")}`);
    assert.ok(!got.has("h-8") && !got.has("h-10") && !got.has("h-12"), `${size ?? "default"} keeps beUI's height`);
  }
  const icon = classes(h(Button, { size: "icon", "aria-label": "Close" }, "x"));
  assert.ok(icon.has("size-7") && icon.has("rounded-md") && !icon.has("h-8"));
});

test("a tile is as high as it holds and wraps, a height it names its own winning", () => {
  const tile = classes(h(Button, { size: "tile", className: "w-full flex-col" }, "Parcel study"));
  assert.ok(tile.has("h-auto") && tile.has("whitespace-normal") && tile.has("px-4"), [...tile].join(" "));
  assert.ok(!tile.has("h-7") && !tile.has("whitespace-nowrap"));
  const full = classes(h(Button, { size: "tile", className: "h-full" }, "Cover"));
  assert.ok(full.has("h-full") && !full.has("h-auto"));
});

test("destructive is the outline variant in red, named on the element for the consumer's stylesheet", () => {
  const html = renderToStaticMarkup(h(Button, { variant: "destructive" }, "Delete"));
  assert.match(html, /data-button="destructive"/);
  assert.match(html, /border-destructive\/40/);
});

test("STILL holds a row still and beUI's link draws an anchor", () => {
  assert.deepEqual(STILL, { pressScale: 1, whileHover: { scale: 1 } });
  assert.match(renderToStaticMarkup(h(ButtonLink, { href: "/sign-up" }, "Start")), /^<a [^>]*href="\/sign-up"/);
});

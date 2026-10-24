// The time lanes (./lanes, ./lanes/flow, v0.8.0): their arithmetic, moved from the panel's cockpit with its tests, a run's spans on
// their own clock, and the lanes drawn with the room's words, with and without the money under them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { everyTick, monthAt, ROUND_TICKS, RUN_STEPS, secondsOf, STEPS_MS, tickOf, ticks, timed, TimeLanes, trough } from "eemh-design/lanes";
import { flowUnder } from "eemh-design/lanes/flow";

test("the deepest a running total goes is the month the money needed peaks; none when it never goes under nought", () => {
  assert.deepEqual(trough([-52, -52.1, -60.4, -58, 3]), { at: 2, value: -60.4 });
  assert.equal(trough([0, 4, 9]), null);
});

test("an axis takes round values that hold its ends", () => {
  assert.deepEqual(ticks(-61, 92), [-100, -50, 0, 50, 100]);
  assert.deepEqual(ticks(0, 1), [0, 0.2, 0.4, 0.6000000000000001, 0.8, 1]);
});

test("a lane writes its months far enough apart, and a point names the month under it within the lane", () => {
  assert.equal(everyTick(11.7), 3);
  assert.equal(everyTick(40), 1);
  // a run's tenths of a second written every half second where they stand 9 px apart, every fifth tenth
  assert.equal(everyTick(9, 40, ROUND_TICKS), 5);
  assert.equal(everyTick(0.1, 40, ROUND_TICKS), 100);
  assert.equal(monthAt(0, 0, 10, 35), 0);
  assert.equal(monthAt(95, 20, 10, 35), 11);
  assert.equal(monthAt(10_000, 0, 10, 35), 34);
});

test("what ran stands on its run's clock where each began, for as long as it took, one without both its times left off", () => {
  // Render's queue: three cameras rendered one after another, the second the slowest, one that never ended
  const shots = [{ name: "b", from: 1_000 + 4_200, to: 1_000 + 13_000 }, { name: "a", from: 1_000, to: 1_000 + 4_200 },
    { name: "c", from: 1_000 + 13_000, to: 1_000 + 15_500 }, { name: "d", from: 1_000 + 15_500, to: Number.NaN }];
  const run = timed(shots, (one) => one, 0);
  assert.equal(run.unit, 500);
  assert.equal(run.whole, 16_500);
  assert.equal(run.steps, 33);
  assert.deepEqual(run.timed.map((one) => [one.item.name, one.start, one.length]), [["a", 2, 8.4], ["b", 10.4, 17.6], ["c", 28, 5]]);
  // counted from the first that began where the run's own start is not known
  assert.equal(timed(shots, (one) => one).timed[0].start, 0);
  assert.equal(timed([{ from: 5, to: 2 }], (one) => one), null);
  assert.equal(timed([], (one) => one), null);
});

test("a run's clock keeps any run within a few dozen ticks and writes every tick in its step's one unit", () => {
  for (const whole of [80, 900, 42_000, 600_000, 5_400_000]) {
    const run = timed([{ from: 0, to: whole }], (one) => one);
    assert.ok(run.steps <= RUN_STEPS, `${whole} ms in ${run.steps} steps of ${run.unit}`);
    assert.ok(STEPS_MS.includes(run.unit));
  }
  assert.equal(tickOf(10, 100, "en"), "1s");
  assert.equal(tickOf(35, 100, "en"), "3.5s");
  assert.equal(tickOf(2, 1_800_000, "en"), "60m");
  assert.equal(tickOf(2, 3_600_000, "en"), "2h");
  assert.equal(secondsOf(840, "en"), "0.84s");
  assert.equal(secondsOf(42_000, "en"), "42s");
  assert.equal(secondsOf(Number.NaN, "en"), "");
});

const WORDS = { axis: "Saniye", lane: "Zaman çizelgesi", zoomIn: "Yakınlaştır", zoomOut: "Uzaklaştır" };
const lane = (key, start, length) => ({ key, name: `Kamera ${key}`, sub: "1920 × 1080", start, length, amount: `${length}s`, colour: "var(--viz-1)",
  label: `Kamera ${key}, ${length}s`, detail: h("span", null, key) });

test("the lanes say the room's words and stand as high as their rows where nothing is drawn under them", () => {
  const html = renderToStaticMarkup(h(TimeLanes, { lanes: [lane("a", 0, 4), lane("b", 4, 9)], at: String, words: WORDS, locale: "tr" }));
  for (const word of ["Saniye", "Zaman çizelgesi", "Yakınlaştır", "Uzaklaştır", "Kamera a", "Kamera b", "1920 × 1080", "Kamera b, 9s"]) {
    assert.ok(html.includes(word), word);
  }
  // the axis' head (24) and a row each (28)
  assert.match(html, /height:80px/);
  // the zoom's own figure in the room's language
  assert.ok(html.includes("1×"));
});

test("the money under the lanes brings its key and its months, and the lanes then fill the room's height", () => {
  const flow = { net: [-50, -10, 20, 70], total: [-50, -60, -40, 30], short: (n) => `${n} Mn`, whole: (n) => `${n} TL` };
  const words = { net: "Ayın neti", total: "Birikimli toplam", in: "Giren", out: "Çıkan", peak: (value, month) => `En çok ${value} · ay ${month}` };
  const under = flowUnder(flow, words);
  assert.equal(under.steps, 4);
  const html = renderToStaticMarkup(h(TimeLanes, { lanes: [lane("a", 0, 2)], at: String, words: { ...WORDS, axis: "Ay" }, locale: "tr", under }));
  for (const word of ["Giren", "Çıkan", "Birikimli toplam", "Ay"]) assert.ok(html.includes(word), word);
  assert.doesNotMatch(html, /height:52px/);
  assert.match(html, /flex-1/);
  // what the pointer reads of a month and the scale's round values come from the money's own words
  assert.ok(renderToStaticMarkup(h("div", null, under.read(1))).includes("-60 TL"));
  const marks = renderToStaticMarkup(h("div", null, under.marks({ steps: 4, width: 10, span: 40, hover: null, top: 52, height: 300 })));
  assert.ok(marks.includes("-100 Mn") && marks.includes("50 Mn"), marks);
});

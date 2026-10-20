// The keyboard press eemh-design/vite serves in motion-dom's place (ronchamp #89), against the one it replaces, and the plugin's
// hold on the file it replaces.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KEYBOARD_PRESS, MOTION_KEYBOARD_SHA256, pressKeyboard } from "eemh-design/vite";

// node has no PointerEvent: what the press fires needs only its type and isPrimary
globalThis.PointerEvent = class extends Event {
  constructor(type, init) {
    super(type, init);
    this.isPrimary = init?.isPrimary ?? false;
  }
};

// both presses keep motion-dom's own press state, as a build resolves it
const press = path.join(path.dirname(createRequire(import.meta.url).resolve("motion-dom")), "..", "es", "gestures", "press", "utils");
const original = path.join(press, "keyboard.mjs");
const served = KEYBOARD_PRESS.replace('"./state.mjs"', JSON.stringify(pathToFileURL(path.join(press, "state.mjs")).href));
const fixed = (await import(`data:text/javascript,${encodeURIComponent(served)}`)).enableKeyboardPress;
const motion = (await import(pathToFileURL(original).href)).enableKeyboardPress;

/** A focusable button: the pointer events it fires and the listeners it holds. */
class Button extends EventTarget {
  fired = [];
  held = new Set();
  constructor() {
    super();
    for (const type of ["pointerdown", "pointerup", "pointercancel"]) super.addEventListener(type, () => this.fired.push(type.slice(7)));
  }
  addEventListener(type, listener, options) {
    this.held.add(listener);
    super.addEventListener(type, listener, options);
  }
  removeEventListener(type, listener, options) {
    this.held.delete(listener);
    super.removeEventListener(type, listener, options);
  }
  focus(enable) {
    enable({ currentTarget: this }, {});
  }
  key(type, key = "Enter") {
    this.dispatchEvent(Object.assign(new Event(type), { key }));
  }
  enter() {
    this.key("keydown");
    this.key("keyup");
  }
  blur() {
    this.dispatchEvent(new Event("blur"));
  }
}

test("motion's own keyboard press leaves its listeners behind, and a blur long after the press fires a cancel", () => {
  const button = new Button();
  button.focus(motion);
  button.enter();
  button.blur();
  assert.deepEqual(button.fired, ["down", "up", "cancel"]);
  assert.ok(button.held.size > 0);
});

test("the served keyboard press ends each press once and leaves nothing behind its focus", () => {
  const button = new Button();
  button.focus(fixed);
  for (let n = 0; n < 50; n++) button.enter();
  button.blur();
  assert.deepEqual(button.fired, Array.from({ length: 50 }, () => ["down", "up"]).flat());
  assert.equal(button.held.size, 0);
  button.fired = [];
  button.focus(fixed);
  button.key("keydown", " ");
  button.key("keydown");
  button.blur();
  button.key("keyup");
  assert.deepEqual(button.fired, ["down", "cancel"]);
  assert.equal(button.held.size, 0);
});

test("the plugin serves it for motion-dom's file alone, and stops on a motion-dom that changed it", () => {
  const plugin = pressKeyboard();
  assert.equal(plugin.load(original), KEYBOARD_PRESS);
  assert.equal(plugin.load(`${original}?v=1`), KEYBOARD_PRESS);
  assert.equal(plugin.load(path.join(press, "state.mjs")), null);
  const work = mkdtempSync(path.join(tmpdir(), "eemh-design-press-"));
  try {
    const changed = path.join(work, "node_modules", "motion-dom", "dist", "es", "gestures", "press", "utils", "keyboard.mjs");
    mkdirSync(path.dirname(changed), { recursive: true });
    writeFileSync(changed, readFileSync(original, "utf8") + "// changed\n");
    assert.throws(() => plugin.load(changed), /read the new one/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  assert.equal(MOTION_KEYBOARD_SHA256.length, 64);
});

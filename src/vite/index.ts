/// <reference types="node" />
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/* motion-dom's keyboard press (dist/es/gestures/press/utils/keyboard.mjs, the same file from 13.3.0 to 14.4.0) leaves the keyup and
   blur listeners of every Enter press on the element, and a blur listener per focus: the next blur, long after the press ended,
   fires a pointercancel that bubbles to the window and cancels a mouse press under way on another button (ronchamp #89). The button
   presses through motion, so the fix is kept with it: pressKeyboard() serves KEYBOARD_PRESS in that file's place, in a Vite build
   and in Vite's dependency bundle (optimizeDeps.rolldownOptions.plugins), held to the file it replaces, so a motion-dom that
   changes it stops the build until someone reads the new one. */

/** The keyboard press served in motion-dom's place: Enter on a focused element presses it as a pointer would, each press owning
 * its keyup and blur listeners and ending once, on Enter's keyup or on blur; each focus owning its keydown listener until its
 * blur. Its import resolves beside the file it replaces, so the press state is motion-dom's own. */
export const KEYBOARD_PRESS: string = `import { isPressing } from "./state.mjs";

const onEnter = (callback) => (event) => {
  if (event.key === "Enter") callback(event);
};
const firePointer = (element, type) =>
  element.dispatchEvent(new PointerEvent("pointer" + type, { isPrimary: true, bubbles: true }));

export const enableKeyboardPress = (focusEvent, eventOptions) => {
  const element = focusEvent.currentTarget;
  if (!element) return;
  const keydown = onEnter(() => {
    if (isPressing.has(element)) return;
    firePointer(element, "down");
    const end = (type) => {
      element.removeEventListener("keyup", keyup, eventOptions);
      element.removeEventListener("blur", blur, eventOptions);
      firePointer(element, type);
    };
    const keyup = onEnter(() => end("up"));
    const blur = () => end("cancel");
    element.addEventListener("keyup", keyup, eventOptions);
    element.addEventListener("blur", blur, eventOptions);
  });
  const leave = () => {
    element.removeEventListener("keydown", keydown, eventOptions);
    element.removeEventListener("blur", leave, eventOptions);
  };
  element.addEventListener("keydown", keydown, eventOptions);
  element.addEventListener("blur", leave, eventOptions);
};
`;

/** The sha256 of the motion-dom file KEYBOARD_PRESS replaces. */
export const MOTION_KEYBOARD_SHA256 = "77a72938f56fa301583a29c3cbea8877eabf557437ac902619b54e67f17cc24a";
const MOTION_KEYBOARD = /[\\/]motion-dom[\\/]dist[\\/]es[\\/]gestures[\\/]press[\\/]utils[\\/]keyboard\.mjs$/;

/** A Vite (and Rolldown) plugin serving KEYBOARD_PRESS for motion-dom's keyboard press; anything else it leaves alone. */
export function pressKeyboard() {
  return {
    name: "eemh-design:press-keyboard",
    enforce: "pre" as const,
    load(id: string): string | null {
      const path = id.split("?")[0]!;
      if (!MOTION_KEYBOARD.test(path)) return null;
      const held = createHash("sha256").update(readFileSync(path)).digest("hex");
      if (held !== MOTION_KEYBOARD_SHA256)
        throw new Error(`motion-dom's ${path} is not the one eemh-design's KEYBOARD_PRESS replaces (sha256 ${held}): read the new one`);
      return KEYBOARD_PRESS;
    },
  };
}

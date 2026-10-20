import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
export const KEYBOARD_PRESS = `import { isPressing } from "./state.mjs";

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
export const MOTION_KEYBOARD_SHA256 = "77a72938f56fa301583a29c3cbea8877eabf557437ac902619b54e67f17cc24a";
const MOTION_KEYBOARD = /[\\/]motion-dom[\\/]dist[\\/]es[\\/]gestures[\\/]press[\\/]utils[\\/]keyboard\.mjs$/;
export function pressKeyboard() {
    return {
        name: "eemh-design:press-keyboard",
        enforce: "pre",
        load(id) {
            const path = id.split("?")[0];
            if (!MOTION_KEYBOARD.test(path))
                return null;
            const held = createHash("sha256").update(readFileSync(path)).digest("hex");
            if (held !== MOTION_KEYBOARD_SHA256)
                throw new Error(`motion-dom's ${path} is not the one eemh-design's KEYBOARD_PRESS replaces (sha256 ${held}): read the new one`);
            return KEYBOARD_PRESS;
        },
    };
}

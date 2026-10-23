import { isoDrawing, isoFaceClass, isoPartStyle, type IsoDrawn } from "./geometry.js";

/* The same drawings for a page drawn without React (Mies's own dialogs and panels): the elements built from ./geometry.ts, styled
   by the same iso.css, sized by the height asked (such a page carries no Tailwind). */

const SVG = "http://www.w3.org/2000/svg";

/** The drawing alone, `height` px tall (its width follows its view box); `idle`: an empty place's, whole and breathing slowly. */
export function isoSvg(motif: IsoDrawn, { height, idle = false }: { height: number; idle?: boolean }): SVGSVGElement {
  const drawn = isoDrawing(motif);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", drawn.view);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", idle ? "iso iso-idle" : "iso");
  svg.style.height = `${height}px`;
  svg.style.width = "auto";
  svg.style.overflow = "visible";
  svg.style.flexShrink = "0";
  const whole = document.createElementNS(SVG, "g");
  if (idle) whole.setAttribute("class", "iso-float");
  for (const part of drawn.parts) {
    const g = document.createElementNS(SVG, "g");
    g.setAttribute("class", `iso-${part.motion}`);
    for (const [name, value] of Object.entries(isoPartStyle(part))) g.style.setProperty(name === "animationDelay" ? "animation-delay" : name, value);
    for (const face of part.faces) {
      const polygon = document.createElementNS(SVG, "polygon");
      polygon.setAttribute("class", isoFaceClass(face));
      polygon.setAttribute("points", face.points);
      g.append(polygon);
    }
    whole.append(g);
  }
  svg.append(whole);
  return svg;
}

/** A wait: the drawing, unseen under 150 ms, said to a screen reader as `label`, or with `said` written under it (beside it in a
 * `row`, one block in the line's own type). */
export function isoWait({ motif = "blocks", label, said, row = false }: { motif?: IsoDrawn; label?: string; said?: string; row?: boolean }): HTMLElement {
  const wait = document.createElement("span");
  wait.setAttribute("role", "status");
  wait.className = row ? "iso-wait iso-line" : "iso-wait iso-stack";
  wait.append(isoSvg(row ? "block" : motif, { height: row ? 16 : 64 }));
  const words = said ?? label;
  if (words) {
    const text = document.createElement("span");
    text.textContent = words;
    if (!said) text.className = "iso-unseen";
    wait.append(text);
  }
  return wait;
}

/** An empty place: the drawing at rest over its one honest sentence (`row`: one block before it, in the line's own type). */
export function isoEmpty({ motif = "grid", sentence, row = false }: { motif?: IsoDrawn; sentence: string; row?: boolean }): HTMLElement {
  const empty = document.createElement(row ? "span" : "div");
  empty.className = row ? "iso-line" : "iso-stack";
  empty.append(isoSvg(row ? "block" : motif, { height: row ? 16 : 64, idle: true }));
  const text = document.createElement(row ? "span" : "p");
  text.textContent = sentence;
  empty.append(text);
  return empty;
}

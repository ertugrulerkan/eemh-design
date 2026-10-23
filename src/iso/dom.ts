import { isoDrawing, isoFaceClass, isoPartStyle, type IsoMotif } from "./geometry.js";

/* The same drawings for a page drawn without React (Mies's own dialogs and panels): the elements built from ./geometry.ts, styled
   by the same iso.css, sized by the height asked (such a page carries no Tailwind), the page setting them in its own lines and
   words (iso.css `iso-line`). Only elements and their attributes, the style too, so the least DOM draws it. */

const SVG = "http://www.w3.org/2000/svg";

/** The drawing alone, its module's `motif` (the page's own subject, given where its screens are made), `height` px tall (its width
 * follows its view box); `small`: its small form, a line's; `idle`: an empty place's, whole and breathing slowly. */
export function isoSvg(motif: IsoMotif, { height, small = false, idle = false }: { height: number; small?: boolean; idle?: boolean }): SVGSVGElement {
  const drawn = isoDrawing(motif, small);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", drawn.view);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", idle ? "iso iso-idle" : "iso");
  svg.setAttribute("style", `height: ${height}px; width: auto; overflow: visible; flex-shrink: 0`);
  const whole = document.createElementNS(SVG, "g");
  if (idle) whole.setAttribute("class", "iso-float");
  for (const part of drawn.parts) {
    const g = document.createElementNS(SVG, "g");
    g.setAttribute("class", `iso-${part.motion}`);
    const style = Object.entries(isoPartStyle(part)).map(([name, value]) => `${name === "animationDelay" ? "animation-delay" : name}: ${value}`);
    if (style.length) g.setAttribute("style", style.join("; "));
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

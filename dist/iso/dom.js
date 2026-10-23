import { isoDrawing, isoFaceClass, isoPartStyle } from "./geometry.js";
const SVG = "http://www.w3.org/2000/svg";
export function isoSvg(motif, { height, small = false, idle = false }) {
    const drawn = isoDrawing(motif, small);
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", drawn.view);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", idle ? "iso iso-idle" : "iso");
    svg.setAttribute("style", `height: ${height}px; width: auto; overflow: visible; flex-shrink: 0`);
    const whole = document.createElementNS(SVG, "g");
    if (idle)
        whole.setAttribute("class", "iso-float");
    for (const part of drawn.parts) {
        const g = document.createElementNS(SVG, "g");
        g.setAttribute("class", `iso-${part.motion}`);
        const style = Object.entries(isoPartStyle(part)).map(([name, value]) => `${name === "animationDelay" ? "animation-delay" : name}: ${value}`);
        if (style.length)
            g.setAttribute("style", style.join("; "));
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

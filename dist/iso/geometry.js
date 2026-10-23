const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const flat = ([x, y, z]) => [(x - y) * COS, (x + y) * SIN - z];
const points = (pts) => pts.map((p) => flat(p).map((v) => v.toFixed(3)).join(",")).join(" ");
export const CYCLE = 2.4;
const at = (seconds) => Number((seconds - CYCLE).toFixed(2));
const from = (dx, dy) => [Number(((dx - dy) * COS).toFixed(3)), Number(((dx + dy) * SIN).toFixed(3))];
function box({ x, y, z = 0, w = 1, d = 1, h = 1, edge = false }) {
    return [
        { side: "side-y", edge: false, points: points([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]) },
        { side: "side-x", edge: false, points: points([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]) },
        { side: "top", edge, points: points([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]) },
    ];
}
const DRAWINGS = {
    building: () => ({
        view: "-1.9 -1.95 4.2 4.2",
        parts: [
            { motion: "plate", faces: box({ x: 0, y: 0, w: 2.4, d: 1.8, h: 0.06 }) },
            ...[0, 1, 2].map((k) => ({ motion: "rise", delay: at(k * 0.35), faces: box({ x: 0.3, y: 0.25, z: 0.06 + k * 0.55, w: 1.8, d: 1.3, h: 0.5, edge: k === 2 }) })),
        ],
    }),
    sheets: () => ({
        view: "-1.6 -1.1 3.6 3.0",
        parts: [0, 1, 2].map((k) => ({ motion: "slide", delay: at(k * 0.35), from: from(0.6, -0.3), faces: box({ x: 0, y: 0, z: k * 0.24, w: 2, d: 1.4, h: 0.05, edge: k === 2 }) })),
    }),
    blocks: () => ({
        view: "-2.2 -1.7 4.4 3.9",
        parts: [[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j], k) => ({
            motion: "join", delay: at(k * 0.12), from: from((i - 0.5) * 0.9, (j - 0.5) * 0.9), faces: box({ x: i * 0.96, y: j * 0.96, w: 0.92, d: 0.92, h: 0.92, edge: k === 3 }),
        })),
    }),
    grid: () => ({
        view: "-2.9 -0.9 5.8 4.0",
        parts: [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => ({ motion: "wave", delay: at((i + j) * 0.14), faces: box({ x: i, y: j, w: 0.86, d: 0.86, h: 0.34, edge: i === 2 && j === 2 }) }))),
    }),
    path: () => {
        const steps = [[0.2, 1.3], [0.8, 1.3], [1.4, 1.3], [2.05, 1.25], [2.1, 0.68], [2.1, 0.1]];
        return {
            view: "-1.75 -0.95 4.2 3.35",
            parts: [
                { motion: "plate", faces: box({ x: 0, y: 0, w: 2.6, d: 1.8, h: 0.06 }) },
                ...steps.map(([x, y], k) => {
                    const last = k === steps.length - 1;
                    return { motion: "step", delay: at(k * 0.22), faces: box({ x, y, z: 0.06, w: 0.34, d: 0.34, h: last ? 0.6 : 0.26, edge: last }) };
                }),
            ],
        };
    },
    block: () => ({ view: "-1.0 -1.3 2.0 2.5", parts: [{ motion: "bob", faces: box({ x: 0, y: 0, w: 1, d: 1, h: 1, edge: true }) }] }),
};
const drawn = new Map();
export function isoDrawing(motif) {
    let one = drawn.get(motif);
    if (!one)
        drawn.set(motif, (one = DRAWINGS[motif]()));
    return one;
}
export function isoPartStyle(part) {
    const style = {};
    if (part.delay !== undefined)
        style.animationDelay = `${part.delay.toFixed(2)}s`;
    if (part.from) {
        style["--iso-dx"] = `${part.from[0]}px`;
        style["--iso-dy"] = `${part.from[1]}px`;
    }
    return style;
}
export const isoFaceClass = (face) => (face.edge ? `iso-${face.side} iso-edge` : `iso-${face.side}`);
export const APPEAR_MS = 150;
export const STAY_MS = 400;
export function stayFor(began, ended) {
    if (ended - began < APPEAR_MS)
        return 0;
    return Math.max(0, began + APPEAR_MS + STAY_MS - ended);
}

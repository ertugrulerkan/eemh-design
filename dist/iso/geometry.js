export const ISO_MOTIFS = ["building", "tiles", "blocks", "drawers", "grid", "steps", "page", "flow", "sliders", "cloud", "stamp",
    "parcel", "rooms", "sheets", "pen", "storeys", "light", "crowd", "ledger"];
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const flat = ([x, y, z]) => [(x - y) * COS, (x + y) * SIN - z];
const points = (pts) => pts.map((p) => flat(p).map((v) => v.toFixed(3)).join(",")).join(" ");
export const CYCLE = 2.4;
const at = (seconds) => Number((seconds - CYCLE).toFixed(2));
const from = (dx, dy, up = 0) => [Number(((dx - dy) * COS).toFixed(3)), Number(((dx + dy) * SIN - up).toFixed(3))];
function box({ x, y, z = 0, w = 1, d = 1, h = 1, edge = false }) {
    const edged = edge === true ? "top" : edge;
    return [
        { side: "side-y", edge: edged === "side-y", points: points([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]) },
        { side: "side-x", edge: edged === "side-x", points: points([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]) },
        { side: "top", edge: edged === "top", points: points([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]) },
    ];
}
const plate = (b) => ({ motion: "plate", faces: box({ h: 0.06, ...b }) });
const part = (motion, b, delay, comes) => ({ motion, faces: box(b), ...(delay !== undefined ? { delay } : {}), ...(comes ? { from: comes } : {}) });
const person = (x, y, z, size, delay, comes) => [
    part("slide", { x, y, z, w: size, d: size, h: size * 2 }, delay, comes),
    part("slide", { x: x + size * 0.2, y: y + size * 0.2, z: z + size * 2.15, w: size * 0.6, d: size * 0.6, h: size * 0.6 }, delay, comes)
];
function framed(parts) {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const one of parts) {
        const [dx, dy] = one.from ?? [0, 0];
        for (const face of one.faces) {
            for (const pair of face.points.split(" ")) {
                const [px, py] = pair.split(",").map(Number);
                for (const [qx, qy] of [[px, py], [px + dx, py + dy]]) {
                    [x0, y0, x1, y1] = [Math.min(x0, qx), Math.min(y0, qy), Math.max(x1, qx), Math.max(y1, qy)];
                }
            }
        }
    }
    const pad = Math.max(x1 - x0, y1 - y0) * 0.08;
    return { view: [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map((v) => v.toFixed(2)).join(" "), parts };
}
const DRAWINGS = {
    building: {
        whole: () => [plate({ x: 0, y: 0, w: 2.4, d: 1.8 }),
            ...[0, 1, 2].map((k) => part("rise", { x: 0.3, y: 0.25, z: 0.06 + k * 0.55, w: 1.8, d: 1.3, h: 0.5, edge: k === 2 }, at(k * 0.35)))],
        small: () => [plate({ x: 0, y: 0, w: 1.4, d: 1.4, h: 0.1 }), part("rise", { x: 0.2, y: 0.2, z: 0.1, w: 1, d: 1, h: 0.9, edge: true }, at(0))],
    },
    tiles: {
        whole: () => [plate({ x: -0.2, y: -0.2, w: 0.9, d: 2.9 }),
            ...[1.0, 1.4, 0.8].map((h, k) => part("step", { x: 0.1, y: k * 0.9, z: 0.06, w: 0.1, d: 0.72, h, edge: k === 1 ? "side-x" : false }, at(k * 0.3)))],
        small: () => [0.9, 1.3].map((h, k) => part("step", { x: 0, y: k * 0.75, w: 0.12, d: 0.6, h, edge: k === 1 ? "side-x" : false }, at(k * 0.4))),
    },
    blocks: {
        whole: () => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j], k) => part("join", { x: i * 0.96, y: j * 0.96, w: 0.92, d: 0.92, h: 0.92, edge: k === 3 }, at(k * 0.12), from((i - 0.5) * 0.9, (j - 0.5) * 0.9))),
        small: () => [0, 1].map((i) => part("join", { x: i * 0.96, y: 0, w: 0.92, d: 0.92, h: 0.92, edge: i === 1 }, at(i * 0.12), from((i - 0.5) * 0.9, 0))),
    },
    drawers: {
        whole: () => [plate({ x: 0, y: 0, w: 1.3, d: 2.1, h: 1.36 }),
            ...[2, 1, 0].map((k) => part("join", { x: 1.3, y: 0.12, z: 0.1 + k * 0.42, w: 0.12, d: 1.86, h: 0.34, edge: k === 2 ? "side-x" : false }, at((2 - k) * 0.25), from(0.7, 0)))],
        small: () => [plate({ x: 0, y: 0, w: 1, d: 1.4, h: 0.9 }),
            part("join", { x: 1, y: 0.12, z: 0.3, w: 0.12, d: 1.16, h: 0.36, edge: "side-x" }, at(0), from(0.6, 0))],
    },
    grid: {
        whole: () => [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => part("wave", { x: i, y: j, w: 0.86, d: 0.86, h: 0.34, edge: i === 2 && j === 2 }, at((i + j) * 0.14)))),
        small: () => [0, 1].flatMap((i) => [0, 1].map((j) => part("wave", { x: i, y: j, w: 0.86, d: 0.86, h: 0.5, edge: i === 1 && j === 1 }, at((i + j) * 0.2)))),
    },
    steps: {
        whole: () => {
            const steps = [[0.2, 1.3], [0.8, 1.3], [1.4, 1.3], [2.05, 1.25], [2.1, 0.68], [2.1, 0.1]];
            return [plate({ x: 0, y: 0, w: 2.6, d: 1.8 }),
                ...steps.map(([x, y], k) => part("step", { x, y, z: 0.06, w: 0.34, d: 0.34, h: k === steps.length - 1 ? 0.6 : 0.26, edge: k === steps.length - 1 }, at(k * 0.22)))];
        },
        small: () => [part("step", { x: 0, y: 0.6, w: 0.5, d: 0.5, h: 0.4 }, at(0)), part("step", { x: 0.7, y: 0, w: 0.5, d: 0.5, h: 0.9, edge: true }, at(0.5))],
    },
    page: {
        whole: () => [plate({ x: 0, y: 0, w: 0.08, d: 1.5, h: 1.9 }),
            ...[1.0, 0.75, 1.1, 0.6].map((d, k) => part("rise", { x: 0.08, y: 0.2, z: 1.55 - k * 0.36, w: 0.03, d, h: 0.1, edge: k === 3 ? "side-x" : false }, at(k * 0.3)))],
        small: () => [plate({ x: 0, y: 0, w: 0.08, d: 1, h: 1.3 }),
            ...[0.7, 0.45].map((d, k) => part("rise", { x: 0.08, y: 0.15, z: 0.85 - k * 0.42, w: 0.04, d, h: 0.16, edge: k === 1 ? "side-x" : false }, at(k * 0.4)))],
    },
    flow: {
        whole: () => [
            ...[0, 1].map((k) => plate({ x: 0.5 + k * 1.2, y: 0.2, z: 0.2, w: 0.7, d: 0.1, h: 0.04 })),
            ...[0, 1, 2].map((k) => plate({ x: k * 1.2, y: 0, w: 0.5, d: 0.5, h: 0.5, edge: k === 2 })),
            ...[0, 1].map((k) => part("slide", { x: 0.65 + k * 1.2, y: 0.15, z: 0.24, w: 0.2, d: 0.2, h: 0.2 }, at(k * 0.6), from(-0.5, 0))),
        ],
        small: () => [plate({ x: 0, y: 0, w: 0.5, d: 0.5, h: 0.5 }), plate({ x: 1.1, y: 0, w: 0.5, d: 0.5, h: 0.5, edge: true }),
            part("slide", { x: 0.65, y: 0.15, z: 0.15, w: 0.24, d: 0.24, h: 0.24 }, at(0), from(-0.3, 0))],
    },
    sliders: {
        whole: () => [0, 1, 2].flatMap((k) => [plate({ x: k * 0.6, y: 0, w: 0.16, d: 2.2, h: 0.08 }),
            part("join", { x: k * 0.6 - 0.07, y: [1.3, 0.5, 1.6][k], z: 0.08, w: 0.3, d: 0.3, h: 0.26, edge: k === 1 }, at(k * 0.2), from(0, [-0.8, 0.9, -0.6][k]))]),
        small: () => [plate({ x: 0, y: 0, w: 0.2, d: 1.6, h: 0.1 }), part("join", { x: -0.12, y: 0.9, z: 0.1, w: 0.44, d: 0.44, h: 0.36, edge: true }, at(0), from(0, -0.7))],
    },
    cloud: {
        whole: () => [
            plate({ x: 0.4, y: 0.2, z: 1.55, w: 1.0, d: 0.9, h: 0.38 }),
            plate({ x: 0, y: 0, z: 1.3, w: 2.2, d: 0.7, h: 0.28 }), plate({ x: 0, y: 0.7, z: 1.3, w: 2.2, d: 0.6, h: 0.22 }),
            plate({ x: 1.3, y: 0.4, z: 1.52, w: 0.6, d: 0.6, h: 0.2 }),
            part("slide", { x: 0.85, y: 1.35, z: 0.2, w: 0.4, d: 0.4, h: 0.4, edge: true }, at(0), from(0, 0, -0.8)),
        ],
        small: () => [plate({ x: 0, y: 0, z: 1, w: 1.6, d: 0.7, h: 0.3 }), plate({ x: 0.4, y: 0.1, z: 1.3, w: 0.7, d: 0.5, h: 0.28 }),
            part("slide", { x: 0.6, y: 0.75, z: 0.15, w: 0.45, d: 0.45, h: 0.45, edge: true }, at(0), from(0, 0, -0.5))],
    },
    stamp: {
        whole: () => [plate({ x: 0, y: 0, w: 2, d: 1.5, h: 0.04 }),
            part("step", { x: 0.65, y: 0.4, z: 0.04, w: 0.7, d: 0.7, h: 0.01, edge: true }, at(0.3)),
            part("join", { x: 0.6, y: 0.35, z: 0.1, w: 0.8, d: 0.8, h: 0.22 }, at(0), from(0, 0, 0.7)),
            part("join", { x: 0.85, y: 0.6, z: 0.32, w: 0.3, d: 0.3, h: 0.6 }, at(0), from(0, 0, 0.7))],
        small: () => [plate({ x: 0, y: 0, w: 1.3, d: 1.3, h: 0.04, edge: true }),
            part("join", { x: 0.25, y: 0.25, z: 0.1, w: 0.8, d: 0.8, h: 0.25 }, at(0), from(0, 0, 0.5)),
            part("join", { x: 0.5, y: 0.5, z: 0.35, w: 0.3, d: 0.3, h: 0.5 }, at(0), from(0, 0, 0.5))],
    },
    parcel: {
        whole: () => [
            ...[[0, 0], [1.05, 0], [0, 0.85], [0, 1.7], [1.05, 1.7]].map(([x, y]) => plate({ x, y, w: 0.95, d: 0.75, h: 0.08 })),
            part("join", { x: 1.05, y: 0.85, z: 0.3, w: 0.95, d: 0.75, h: 0.08, edge: true }, at(0), from(0, 0, 0.3)),
        ],
        small: () => [plate({ x: 0, y: 0, w: 0.8, d: 1.3, h: 0.1 }),
            part("join", { x: 0.9, y: 0, z: 0.35, w: 0.8, d: 1.3, h: 0.1, edge: true }, at(0), from(0, 0, 0.35))],
    },
    rooms: {
        whole: () => [plate({ x: 0, y: 0, w: 2.4, d: 1.8 }),
            part("rise", { x: 0, y: 0, z: 0.06, w: 2.4, d: 0.08, h: 0.7 }, at(0)),
            part("rise", { x: 0, y: 0.08, z: 0.06, w: 0.08, d: 1.72, h: 0.7 }, at(0.25)),
            part("rise", { x: 1.3, y: 0.08, z: 0.06, w: 0.08, d: 1.72, h: 0.7 }, at(0.5)),
            part("rise", { x: 1.38, y: 0.9, z: 0.06, w: 1.02, d: 0.08, h: 0.7 }, at(0.75)),
            part("rise", { x: 1.45, y: 1.05, z: 0.06, w: 0.88, d: 0.68, h: 0.02, edge: true }, at(1.0))],
        small: () => [plate({ x: 0, y: 0, w: 1.5, d: 1.5, h: 0.1 }),
            part("rise", { x: 0, y: 0, z: 0.1, w: 1.5, d: 0.12, h: 0.8 }, at(0)),
            part("rise", { x: 0, y: 0.12, z: 0.1, w: 0.12, d: 1.38, h: 0.8, edge: "side-x" }, at(0.4))],
    },
    sheets: {
        whole: () => [0, 1, 2].map((k) => part("slide", { x: 0, y: 0, z: k * 0.24, w: 2, d: 1.4, h: 0.05, edge: k === 2 }, at(k * 0.35), from(0.6, -0.3))),
        small: () => [0, 1].map((k) => part("slide", { x: 0, y: 0, z: k * 0.35, w: 1.4, d: 1.1, h: 0.08, edge: k === 1 }, at(k * 0.5), from(0.5, -0.3))),
    },
    pen: {
        whole: () => {
            const pieces = [{ x: 0.2, y: 1.4, w: 1.12, d: 0.12 }, { x: 1.2, y: 0.5, w: 0.12, d: 1.02 }, { x: 1.2, y: 0.5, w: 0.94, d: 0.12 },
                { x: 2.02, y: 0.2, w: 0.12, d: 0.42 }];
            return [plate({ x: 0, y: 0, w: 2.4, d: 1.8, h: 0.04 }),
                ...pieces.map((one, k) => part("rise", { ...one, z: 0.04, h: 0.07, edge: k === pieces.length - 1 }, at(k * 0.3)))];
        },
        small: () => [part("rise", { x: 0, y: 1.0, w: 1.2, d: 0.16, h: 0.1 }, at(0)), part("rise", { x: 1.04, y: 0, w: 0.16, d: 1.16, h: 0.1, edge: true }, at(0.4))],
    },
    storeys: {
        whole: () => [plate({ x: 0, y: 0, w: 2, d: 1.5, h: 0.08 }),
            ...[0, 1].flatMap((k) => {
                const z = 0.08 + k * 0.62;
                return [...[[0.1, 0.1], [1.8, 0.1], [0.1, 1.3], [1.8, 1.3]].map(([x, y]) => part("rise", { x, y, z, w: 0.1, d: 0.1, h: 0.54 }, at(k * 0.5))),
                    part("rise", { x: 0, y: 0, z: z + 0.54, w: 2, d: 1.5, h: 0.08, edge: k === 1 }, at(k * 0.5 + 0.2))];
            })],
        small: () => [plate({ x: 0, y: 0, w: 1.4, d: 1.1, h: 0.1 }),
            ...[[0.1, 0.9], [1.2, 0.9]].map(([x, y]) => part("rise", { x, y, z: 0.1, w: 0.12, d: 0.12, h: 0.6 }, at(0))),
            part("rise", { x: 0, y: 0, z: 0.7, w: 1.4, d: 1.1, h: 0.1, edge: true }, at(0.3))],
    },
    light: {
        whole: () => [plate({ x: 0, y: 0, w: 2.6, d: 2.2, h: 0.04 }),
            part("step", { x: 1.5, y: 0.9, z: 0.04, w: 0.9, d: 0.5, h: 0.01 }, at(0)),
            part("step", { x: 0.9, y: 1.5, z: 0.04, w: 0.5, d: 0.6, h: 0.01 }, at(0.8)),
            part("step", { x: 0.3, y: 1.3, z: 0.04, w: 0.6, d: 0.6, h: 0.01 }, at(1.6)),
            plate({ x: 0.9, y: 0.8, z: 0.04, w: 0.6, d: 0.6, h: 0.7, edge: true }),
            part("step", { x: 0.2, y: 0.3, z: 1.7, w: 0.2, d: 0.2, h: 0.2 }, at(0)),
            part("step", { x: 0.3, y: -0.3, z: 1.8, w: 0.2, d: 0.2, h: 0.2 }, at(0.8)),
            part("step", { x: 1.6, y: -0.2, z: 1.7, w: 0.2, d: 0.2, h: 0.2 }, at(1.6))],
        small: () => [part("step", { x: 0.9, y: 0.5, w: 0.8, d: 0.6, h: 0.02 }, at(0)),
            plate({ x: 0.3, y: 0.3, w: 0.6, d: 0.6, h: 0.8, edge: true }),
            part("step", { x: 0, y: -0.4, z: 1.3, w: 0.25, d: 0.25, h: 0.25 }, at(0))],
    },
    crowd: {
        whole: () => [plate({ x: 0, y: 0.08, w: 2.4, d: 2.2, h: 0.04 }),
            plate({ x: 0, y: 0, w: 1.0, d: 0.08, h: 0.95 }), plate({ x: 1.45, y: 0, w: 0.95, d: 0.08, h: 0.95 }),
            plate({ x: 1.0, y: 0, z: 0.75, w: 0.45, d: 0.08, h: 0.2, edge: "side-y" }),
            ...[0, 1, 2, 3].flatMap((k) => person(1.1 + (k % 2) * 0.12, 0.25 + k * 0.45, 0.04, 0.2, at(k * 0.25), from(0, 0.45)))],
        small: () => [plate({ x: 0, y: 0, w: 0.3, d: 0.1, h: 1.2 }), plate({ x: 0.9, y: 0, w: 0.3, d: 0.1, h: 1.2 }),
            plate({ x: 0.3, y: 0, z: 0.95, w: 0.6, d: 0.1, h: 0.25, edge: "side-y" }), ...person(0.42, 0.35, 0, 0.36, at(0), from(0, 0.6))],
    },
    ledger: {
        whole: () => [plate({ x: 0, y: 0, w: 2.5, d: 0.9, h: 0.04 }),
            ...[0.5, 0.85, 0.65, 1.25].map((h, k) => part("rise", { x: 0.15 + k * 0.58, y: 0.25, z: 0.04, w: 0.4, d: 0.4, h, edge: k === 3 }, at(k * 0.3)))],
        small: () => [0.6, 1.2].map((h, k) => part("rise", { x: k * 0.7, y: 0, w: 0.5, d: 0.5, h, edge: k === 1 }, at(k * 0.4))),
    },
};
const drawn = new Map();
export function isoDrawing(motif, small = false) {
    const key = `${motif}${small ? ".small" : ""}`;
    let one = drawn.get(key);
    if (!one)
        drawn.set(key, (one = framed(DRAWINGS[motif][small ? "small" : "whole"]())));
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

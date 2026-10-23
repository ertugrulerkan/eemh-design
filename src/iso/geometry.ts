/* The isometric drawings every wait and every empty place shows (the owner, 23.10.2026: "tüm bekleme, loading ekranlarını
   izometrik animasyonlara çevir, sistem genelindeki hepsi" · "bekleme/boş ekranlarda da izometrik animasyon"), as data: each motif's
   view box and its parts, each part its faces' points at 30 degrees and its place in the turn. The one owner of the drawing: the
   React components (./index.tsx) and a page drawn without React (./dom.ts) both draw from this. */

export type IsoMotif = "building" | "sheets" | "blocks" | "grid" | "path";
/** A motif, or the one block a row and a button draw. */
export type IsoDrawn = IsoMotif | "block";

/** How a part moves (iso.css `iso-<kind>`): a plate stands still. */
export type IsoMotion = "plate" | "rise" | "slide" | "join" | "wave" | "step" | "bob";
/** A face the viewer sees: the far side along y, the near side along x, the top; `edge`: the work's own piece, edged in the brand. */
export type IsoFace = { side: "side-y" | "side-x" | "top"; edge: boolean; points: string };
/** A moving part: its faces, its delay into the turn (seconds, negative: already moving as the drawing appears) and, for a part
 * that comes from somewhere, how far on the screen it comes from (px of the view box). */
export type IsoPart = { motion: IsoMotion; faces: IsoFace[]; delay?: number; from?: [number, number] };
export type IsoDrawing = { view: string; parts: IsoPart[] };

type P3 = [number, number, number];
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const flat = ([x, y, z]: P3): [number, number] => [(x - y) * COS, (x + y) * SIN - z];
const points = (pts: P3[]) => pts.map((p) => flat(p).map((v) => v.toFixed(3)).join(",")).join(" ");

/** The turn of each motif's moving parts, seconds (iso.css runs every motion over it). */
export const CYCLE = 2.4;
// a part's place in the turn: later parts start later
const at = (seconds: number) => Number((seconds - CYCLE).toFixed(2));
// how far a part comes from on the drawing's own plane (along x and y), as the screen moves it
const from = (dx: number, dy: number): [number, number] => [Number(((dx - dy) * COS).toFixed(3)), Number(((dx + dy) * SIN).toFixed(3))];

/* A box (its near corner x, y, z; w along x, d along y, h up) as the three faces the viewer sees, far ones first. */
function box({ x, y, z = 0, w = 1, d = 1, h = 1, edge = false }: { x: number; y: number; z?: number; w?: number; d?: number; h?: number; edge?: boolean }): IsoFace[] {
  return [
    { side: "side-y", edge: false, points: points([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]) },
    { side: "side-x", edge: false, points: points([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]) },
    { side: "top", edge, points: points([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]) },
  ];
}

/* The motifs: a parcel and a building rising on it (Nolli, Zaha, Aldo); a sheet's leaves laid one on another (Blueprint, Tuval,
   templates); blocks coming together (Mies, Render, projects); a grid's wave (lists and tables); an escape route lit step by step
   (Sullivan, a process); and one block for a row or a button. */
const DRAWINGS: Record<IsoDrawn, () => IsoDrawing> = {
  building: () => ({
    view: "-1.9 -1.95 4.2 4.2",
    parts: [
      { motion: "plate", faces: box({ x: 0, y: 0, w: 2.4, d: 1.8, h: 0.06 }) },
      ...[0, 1, 2].map((k): IsoPart => ({ motion: "rise", delay: at(k * 0.35), faces: box({ x: 0.3, y: 0.25, z: 0.06 + k * 0.55, w: 1.8, d: 1.3, h: 0.5, edge: k === 2 }) })),
    ],
  }),
  sheets: () => ({
    view: "-1.6 -1.1 3.6 3.0",
    parts: [0, 1, 2].map((k) => ({ motion: "slide", delay: at(k * 0.35), from: from(0.6, -0.3), faces: box({ x: 0, y: 0, z: k * 0.24, w: 2, d: 1.4, h: 0.05, edge: k === 2 }) })),
  }),
  blocks: () => ({
    view: "-2.2 -1.7 4.4 3.9",
    parts: ([[0, 0], [1, 0], [0, 1], [1, 1]] as const).map(([i, j], k) => ({
      motion: "join", delay: at(k * 0.12), from: from((i - 0.5) * 0.9, (j - 0.5) * 0.9), faces: box({ x: i * 0.96, y: j * 0.96, w: 0.92, d: 0.92, h: 0.92, edge: k === 3 }),
    })),
  }),
  grid: () => ({
    view: "-2.9 -0.9 5.8 4.0",
    parts: [0, 1, 2].flatMap((i) => [0, 1, 2].map((j): IsoPart => ({ motion: "wave", delay: at((i + j) * 0.14), faces: box({ x: i, y: j, w: 0.86, d: 0.86, h: 0.34, edge: i === 2 && j === 2 }) }))),
  }),
  path: () => {
    const steps = [[0.2, 1.3], [0.8, 1.3], [1.4, 1.3], [2.05, 1.25], [2.1, 0.68], [2.1, 0.1]] as const;
    return {
      view: "-1.75 -0.95 4.2 3.35",
      parts: [
        { motion: "plate", faces: box({ x: 0, y: 0, w: 2.6, d: 1.8, h: 0.06 }) },
        ...steps.map(([x, y], k): IsoPart => {
          const last = k === steps.length - 1;
          return { motion: "step", delay: at(k * 0.22), faces: box({ x, y, z: 0.06, w: 0.34, d: 0.34, h: last ? 0.6 : 0.26, edge: last }) };
        }),
      ],
    };
  },
  block: () => ({ view: "-1.0 -1.3 2.0 2.5", parts: [{ motion: "bob", faces: box({ x: 0, y: 0, w: 1, d: 1, h: 1, edge: true }) }] }),
};

const drawn = new Map<IsoDrawn, IsoDrawing>();
/** A motif's drawing: its view box and its parts, the same object every time it is asked. */
export function isoDrawing(motif: IsoDrawn): IsoDrawing {
  let one = drawn.get(motif);
  if (!one) drawn.set(motif, (one = DRAWINGS[motif]()));
  return one;
}

/** A part's own style: its delay into the turn and where it comes from (iso.css reads `--iso-dx`, `--iso-dy`). */
export function isoPartStyle(part: IsoPart): Record<string, string> {
  const style: Record<string, string> = {};
  if (part.delay !== undefined) style.animationDelay = `${part.delay.toFixed(2)}s`;
  if (part.from) {
    style["--iso-dx"] = `${part.from[0]}px`;
    style["--iso-dy"] = `${part.from[1]}px`;
  }
  return style;
}

/** A face's classes (iso.css): its tone, and the brand's edge on the work's own piece. */
export const isoFaceClass = (face: IsoFace) => (face.edge ? `iso-${face.side} iso-edge` : `iso-${face.side}`);

/* When a wait shows: never under APPEAR_MS, so work that comes at once draws nothing (iso.css holds the drawing back that long);
   once it has shown, at least STAY_MS, so it never blinks. */
export const APPEAR_MS = 150;
export const STAY_MS = 400;

/** How much longer a wait that began at `began` and whose work ended at `ended` (ms) stays shown: none where it never appeared. */
export function stayFor(began: number, ended: number): number {
  if (ended - began < APPEAR_MS) return 0;
  return Math.max(0, began + APPEAR_MS + STAY_MS - ended);
}

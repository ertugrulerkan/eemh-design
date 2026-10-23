export type IsoMotif = "building" | "sheets" | "blocks" | "grid" | "path";
export type IsoDrawn = IsoMotif | "block";
export type IsoMotion = "plate" | "rise" | "slide" | "join" | "wave" | "step" | "bob";
export type IsoFace = {
    side: "side-y" | "side-x" | "top";
    edge: boolean;
    points: string;
};
export type IsoPart = {
    motion: IsoMotion;
    faces: IsoFace[];
    delay?: number;
    from?: [number, number];
};
export type IsoDrawing = {
    view: string;
    parts: IsoPart[];
};
export declare const CYCLE = 2.4;
export declare function isoDrawing(motif: IsoDrawn): IsoDrawing;
export declare function isoPartStyle(part: IsoPart): Record<string, string>;
export declare const isoFaceClass: (face: IsoFace) => string;
export declare const APPEAR_MS = 150;
export declare const STAY_MS = 400;
export declare function stayFor(began: number, ended: number): number;

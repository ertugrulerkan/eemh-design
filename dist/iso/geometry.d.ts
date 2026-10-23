export declare const ISO_MOTIFS: readonly ["building", "tiles", "blocks", "drawers", "grid", "steps", "page", "flow", "sliders", "cloud", "stamp", "parcel", "rooms", "sheets", "pen", "storeys", "light", "crowd", "ledger"];
export type IsoMotif = (typeof ISO_MOTIFS)[number];
export type IsoMotion = "plate" | "rise" | "slide" | "join" | "wave" | "step";
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
export declare function isoDrawing(motif: IsoMotif, small?: boolean): IsoDrawing;
export declare function isoPartStyle(part: IsoPart): Record<string, string>;
export declare const isoFaceClass: (face: IsoFace) => string;

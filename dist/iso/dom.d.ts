import { type IsoDrawn } from "./geometry.js";
export declare function isoSvg(motif: IsoDrawn, { height, idle }: {
    height: number;
    idle?: boolean;
}): SVGSVGElement;
export declare function isoWait({ motif, label, said, row }: {
    motif?: IsoDrawn;
    label?: string;
    said?: string;
    row?: boolean;
}): HTMLElement;
export declare function isoEmpty({ motif, sentence, row }: {
    motif?: IsoDrawn;
    sentence: string;
    row?: boolean;
}): HTMLElement;

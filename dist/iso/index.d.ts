import type { CSSProperties, ReactNode } from "react";
import { type IsoDrawn, type IsoMotif } from "./geometry.js";
export { CYCLE, isoDrawing, isoFaceClass, isoPartStyle } from "./geometry.js";
export type { IsoDrawing, IsoDrawn, IsoFace, IsoMotif, IsoMotion, IsoPart } from "./geometry.js";
export type IsoSize = "screen" | "section" | "card" | "fit" | "row" | "button";
export declare function IsoDrawingSvg({ motif, className, idle }: {
    motif: IsoDrawn;
    className?: string;
    idle?: boolean;
}): import("react").JSX.Element;
export declare function IsoLoader({ size, motif, label, said, quiet, className, style }: {
    size?: IsoSize;
    motif?: IsoMotif;
    label?: string;
    said?: ReactNode;
    quiet?: boolean;
    className?: string;
    style?: CSSProperties;
}): import("react").JSX.Element;
export declare function IsoFill({ motif, label }: {
    motif?: IsoMotif;
    label?: string;
}): import("react").JSX.Element;
export declare function IsoEmpty({ motif, size, title, children, action, className }: {
    motif?: IsoMotif;
    size?: Exclude<IsoSize, "button">;
    title?: ReactNode;
    children?: ReactNode;
    action?: ReactNode;
    className?: string;
}): import("react").JSX.Element;

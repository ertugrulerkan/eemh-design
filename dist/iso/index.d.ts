import { type CSSProperties, type ReactNode } from "react";
import { type IsoMotif } from "./geometry.js";
export { CYCLE, ISO_MOTIFS, isoDrawing, isoFaceClass, isoPartStyle } from "./geometry.js";
export type { IsoDrawing, IsoFace, IsoMotif, IsoMotion, IsoPart } from "./geometry.js";
export type IsoSize = "screen" | "section" | "card" | "fit" | "row" | "button";
export declare function IsoScope({ motif, children }: {
    motif: IsoMotif;
    children?: ReactNode;
}): import("react").JSX.Element;
export declare const useIsoMotif: () => "blocks" | "building" | "cloud" | "crowd" | "drawers" | "flow" | "grid" | "ledger" | "light" | "page" | "parcel" | "pen" | "rooms" | "sheets" | "sliders" | "stamp" | "steps" | "storeys" | "talk" | "tiles";
export declare function IsoDrawingSvg({ small, className, idle }: {
    small?: boolean;
    className?: string;
    idle?: boolean;
}): import("react").JSX.Element;
export declare function IsoLoader({ size, label, said, quiet, className, style }: {
    size?: IsoSize;
    label?: string;
    said?: ReactNode;
    quiet?: boolean;
    className?: string;
    style?: CSSProperties;
}): import("react").JSX.Element;
export declare function IsoFill({ label }: {
    label?: string;
}): import("react").JSX.Element;
export declare function IsoEmpty({ size, title, children, action, className }: {
    size?: Exclude<IsoSize, "button">;
    title?: ReactNode;
    children?: ReactNode;
    action?: ReactNode;
    className?: string;
}): import("react").JSX.Element;

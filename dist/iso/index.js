import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext } from "react";
import { isoDrawing, isoFaceClass, isoPartStyle } from "./geometry.js";
export { CYCLE, ISO_MOTIFS, isoDrawing, isoFaceClass, isoPartStyle } from "./geometry.js";
const cn = (...names) => names.filter(Boolean).join(" ");
const SIZES = {
    screen: { box: "flex min-h-full w-full flex-1 flex-col items-center justify-center gap-4 py-8", drawing: "h-28 w-40" },
    section: { box: "flex h-full min-h-24 w-full flex-col items-center justify-center gap-2 py-8", drawing: "h-24 w-32" },
    card: { box: "flex h-full min-h-16 w-full flex-col items-center justify-center gap-2 py-4", drawing: "h-16 w-24" },
    fit: { box: "flex w-full items-center justify-center gap-3", drawing: "h-full max-h-20 w-auto" },
    row: { box: "inline-flex items-center gap-2 align-middle", drawing: "size-4" },
    button: { box: "inline-flex items-center", drawing: "size-3.5" },
};
const Motif = createContext("building");
export function IsoScope({ motif, children }) {
    return _jsx(Motif.Provider, { value: motif, children: children });
}
export const useIsoMotif = () => useContext(Motif);
export function IsoDrawingSvg({ small = false, className, idle = false }) {
    const drawn = isoDrawing(useIsoMotif(), small);
    return (_jsx("svg", { viewBox: drawn.view, "aria-hidden": "true", className: cn("iso shrink-0 overflow-visible", idle && "iso-idle", className), children: _jsx("g", { className: idle ? "iso-float" : undefined, children: drawn.parts.map((part, k) => (_jsx("g", { className: `iso-${part.motion}`, style: isoPartStyle(part), children: part.faces.map((face, f) => _jsx("polygon", { className: isoFaceClass(face), points: face.points }, f)) }, k))) }) }));
}
export function IsoLoader({ size = "section", label, said, quiet = false, className, style }) {
    const small = size === "row" || size === "button";
    return (_jsxs("span", { role: quiet ? undefined : "status", "aria-hidden": quiet || undefined, className: cn("iso-wait", SIZES[size].box, className), style: style, children: [_jsx(IsoDrawingSvg, { small: small, className: SIZES[size].drawing }), said ? _jsx("span", { className: small ? undefined : "text-[13.5px] text-muted-foreground", children: said })
                : quiet || !label ? null : _jsx("span", { className: "sr-only", children: label })] }));
}
export function IsoFill({ label }) {
    return (_jsx("div", { className: "absolute inset-0 grid place-items-center bg-muted/40", children: _jsx(IsoLoader, { label: label }) }));
}
export function IsoEmpty({ size = "section", title, children, action, className }) {
    if (size === "row")
        return _jsxs("span", { className: cn(SIZES.row.box, className), children: [_jsx(IsoDrawingSvg, { small: true, className: SIZES.row.drawing, idle: true }), _jsx("span", { children: children })] });
    return (_jsxs("div", { className: cn(SIZES[size].box, "text-center", className), children: [_jsx(IsoDrawingSvg, { className: SIZES[size].drawing, idle: true }), title ? _jsx("p", { className: "text-[15px] font-medium text-foreground", children: title }) : null, children ? _jsx("p", { className: "max-w-md text-[13.5px] text-muted-foreground", children: children }) : null, action ? _jsx("div", { className: "mt-2 flex flex-wrap justify-center gap-2", children: action }) : null] }));
}

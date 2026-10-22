import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { Button as Base, ButtonLink as BaseLink } from "./registry/motion/button/base.js";
import { cn } from "./registry/lib/utils.js";
export { ButtonLink as BeuiButtonLink } from "./registry/motion/button/base.js";
const SIZED = {
    sm: "h-7 gap-2 whitespace-nowrap",
    md: "h-7 px-4 whitespace-nowrap",
    lg: "h-7 px-4 whitespace-nowrap",
    icon: "size-7 rounded-md",
    tile: "h-auto px-4 whitespace-normal",
};
const DESTRUCTIVE = "border-destructive/40 text-destructive hover:bg-destructive/10";
export const STILL = { pressScale: 1, whileHover: { scale: 1 } };
export const Button = forwardRef(function Button({ className, variant = "primary", size = "md", ...rest }, ref) {
    const destructive = variant === "destructive";
    const tile = size === "tile";
    return (_jsx(Base, { ref: ref, ...(tile ? STILL : {}), variant: destructive ? "outline" : variant, size: tile ? "md" : size, "data-button": destructive ? "destructive" : variant, className: cn(SIZED[size], "[&_svg:not([class*='size-'])]:size-4", destructive && DESTRUCTIVE, className), ...rest }));
});
export const ButtonLink = forwardRef(function ButtonLink({ className, variant = "primary", size = "md", ...rest }, ref) {
    return (_jsx(BaseLink, { ref: ref, variant: variant, size: size, "data-button": variant, className: cn(SIZED[size], "[&_svg:not([class*='size-'])]:size-4", className), ...rest }));
});

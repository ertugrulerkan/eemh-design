import { type ButtonProps as BaseProps } from "./registry/motion/button/base.js";
export { ButtonLink, type ButtonLinkProps, type ButtonSize, type ButtonVariant } from "./registry/motion/button/base.js";
declare const SIZED: {
    readonly sm: "h-7 gap-2 whitespace-nowrap";
    readonly md: "h-7 px-4 whitespace-nowrap";
    readonly lg: "h-7 px-4 whitespace-nowrap";
    readonly icon: "size-7 rounded-md";
    readonly tile: "h-auto px-4 whitespace-normal";
};
export declare const STILL: {
    readonly pressScale: 1;
    readonly whileHover: {
        readonly scale: 1;
    };
};
export type ButtonProps = Omit<BaseProps, "variant" | "size"> & {
    variant?: BaseProps["variant"] | "destructive";
    size?: keyof typeof SIZED;
};
export declare const Button: import("react").ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & import("react").RefAttributes<HTMLButtonElement>>;

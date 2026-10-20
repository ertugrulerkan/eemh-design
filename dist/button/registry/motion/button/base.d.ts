import { type HTMLMotionProps } from "motion/react";
import { type ReactNode } from "react";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";
export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    pressScale?: number;
    ripple?: boolean;
    children?: ReactNode;
}
export interface ButtonLinkProps extends Omit<HTMLMotionProps<"a">, "children"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    pressScale?: number;
    children?: ReactNode;
}
export declare const Button: import("react").ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & import("react").RefAttributes<HTMLButtonElement>>;
export declare const ButtonLink: import("react").ForwardRefExoticComponent<Omit<ButtonLinkProps, "ref"> & import("react").RefAttributes<HTMLAnchorElement>>;

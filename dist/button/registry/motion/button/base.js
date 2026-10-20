"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AnimatePresence, motion, useReducedMotion, } from "motion/react";
import { forwardRef, useCallback, useRef, useState, } from "react";
import { EASE_OUT, SPRING_PRESS } from "../../lib/ease.js";
import { useHoverCapable } from "../../lib/hooks/use-hover-capable.js";
import { cn } from "../../lib/utils.js";
const VARIANT_CLASS = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border border-border bg-card text-foreground hover:border-border",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
    outline: "border border-border bg-transparent text-foreground hover:bg-muted/60",
};
const SIZE_CLASS = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-full",
    md: "h-10 px-5 text-sm gap-2 rounded-full",
    lg: "h-12 px-6 text-base gap-2 rounded-full",
    icon: "h-8 w-8 rounded-lg",
};
export const Button = forwardRef(function Button({ variant = "primary", size = "md", pressScale = 0.93, ripple = false, className, children, onPointerDown, ...rest }, ref) {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();
    const [ripples, setRipples] = useState([]);
    const nextId = useRef(0);
    const handlePointerDown = useCallback((event) => {
        if (ripple && !reduce) {
            const rect = event.currentTarget.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const id = nextId.current++;
            setRipples((prev) => [
                ...prev,
                {
                    id,
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    size,
                },
            ]);
        }
        onPointerDown?.(event);
    }, [ripple, reduce, onPointerDown]);
    return (_jsxs(motion.button, { ref: ref, type: "button", whileTap: reduce ? undefined : { scale: pressScale }, whileHover: reduce || !canHover ? undefined : { scale: 1.02 }, transition: SPRING_PRESS, onPointerDown: handlePointerDown, className: cn("inline-flex items-center justify-center font-medium select-none", "transition-colors", "disabled:pointer-events-none disabled:opacity-50", ripple && "relative overflow-hidden", VARIANT_CLASS[variant], SIZE_CLASS[size], className), ...rest, children: [ripple && !reduce ? (_jsx("span", { className: "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", children: _jsx(AnimatePresence, { children: ripples.map((r) => (_jsx(motion.span, { className: "absolute rounded-full bg-current", style: {
                            left: r.x,
                            top: r.y,
                            width: r.size,
                            height: r.size,
                            x: "-50%",
                            y: "-50%",
                        }, initial: { scale: 0.05, opacity: 0.3 }, animate: { scale: 1, opacity: 0 }, exit: { opacity: 0 }, transition: { duration: 1.6, ease: EASE_OUT }, onAnimationComplete: () => setRipples((prev) => prev.filter((x) => x.id !== r.id)) }, r.id))) }) })) : null, children] }));
});
export const ButtonLink = forwardRef(function ButtonLink({ variant = "primary", size = "md", pressScale = 0.93, className, children, ...rest }, ref) {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();
    return (_jsx(motion.a, { ref: ref, whileTap: reduce ? undefined : { scale: pressScale }, whileHover: reduce || !canHover ? undefined : { scale: 1.02 }, transition: SPRING_PRESS, className: cn("inline-flex items-center justify-center font-medium select-none", "transition-colors", VARIANT_CLASS[variant], SIZE_CLASS[size], className), ...rest, children: children }));
});

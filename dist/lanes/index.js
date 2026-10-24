import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Minus, Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Popover } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { Button } from "../button/index.js";
import { EASE_OUT } from "../button/registry/lib/ease.js";
import { cn } from "../button/registry/lib/utils.js";
import { AT_ONE, everyTick, monthAt, ROUND_TICKS, ZOOMS } from "./scale.js";
const ROW = 28;
const AXIS = 24;
export function TimeLanes({ lanes, at, tick, words, locale, under }) {
    const reduce = useReducedMotion();
    const months = Math.ceil(Math.max(under?.steps ?? 0, ...lanes.map((one) => one.start + one.length), 1));
    const lane = useRef(null);
    const [room, setRoom] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const box = lane.current;
        if (!box)
            return;
        const seen = new ResizeObserver(() => setRoom({ width: box.clientWidth, height: box.clientHeight }));
        seen.observe(box);
        return () => seen.disconnect();
    }, []);
    const [zoom, setZoom] = useState(AT_ONE);
    const [shift, setShift] = useState(0);
    const width = (room.width / Math.max(months, 1)) * ZOOMS[zoom];
    const span = months * width;
    const most = Math.max(0, span - room.width);
    const moved = Math.min(Math.max(shift, 0), most);
    const zoomTo = (next) => {
        const to = Math.min(ZOOMS.length - 1, Math.max(0, next));
        if (to === zoom || !room.width)
            return;
        const middle = (moved + room.width / 2) / width;
        const after = (room.width / Math.max(months, 1)) * ZOOMS[to];
        setZoom(to);
        setShift(middle * after - room.width / 2);
    };
    const view = useRef({ zoomTo, zoom });
    view.current = { zoomTo, zoom };
    useEffect(() => {
        const box = lane.current;
        if (!box)
            return;
        let turned = 0;
        const wheel = (event) => {
            if (!event.ctrlKey)
                return;
            event.preventDefault();
            turned += event.deltaY;
            if (Math.abs(turned) < 40)
                return;
            view.current.zoomTo(view.current.zoom + (turned < 0 ? 1 : -1));
            turned = 0;
        };
        box.addEventListener("wheel", wheel, { passive: false });
        return () => box.removeEventListener("wheel", wheel);
    }, []);
    const [hover, setHover] = useState(null);
    const [open, setOpen] = useState(null);
    const drag = useRef(null);
    const down = (event) => {
        if (most <= 0 || event.target.closest("button"))
            return;
        drag.current = { x: event.clientX, from: moved };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const move = (event) => {
        const box = event.currentTarget.getBoundingClientRect();
        if (drag.current)
            setShift(Math.min(Math.max(drag.current.from - (event.clientX - drag.current.x), 0), most));
        if (width > 0)
            setHover(monthAt(event.clientX - box.left, moved, width, months));
    };
    const every = tick ? everyTick(width, tick(months).length * 6.5 + 12, ROUND_TICKS) : everyTick(width);
    const phasesOf = (m) => lanes.filter((one) => m + 1 > one.start && m < one.start + one.length).map((one) => one.name).join(" · ");
    const seen = { steps: months, width, span, hover, top: AXIS + lanes.length * ROW, height: room.height };
    return (_jsxs("div", { className: cn("@container flex min-h-0 flex-col gap-2", under && "flex-1"), children: [_jsxs("div", { className: "flex min-h-7 items-center justify-between gap-3", children: [under?.legend ?? _jsx("span", {}), _jsxs("span", { className: "flex shrink-0 items-center gap-1", children: [_jsx(Button, { size: "icon", variant: "ghost", "aria-label": words.zoomOut, disabled: zoom === 0, onClick: () => zoomTo(zoom - 1), children: _jsx(Minus, {}) }), _jsxs("span", { className: "w-10 text-center text-[12.5px] text-muted-foreground tabular-nums", children: [new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(ZOOMS[zoom]), "\u00D7"] }), _jsx(Button, { size: "icon", variant: "ghost", "aria-label": words.zoomIn, disabled: zoom === ZOOMS.length - 1, onClick: () => zoomTo(zoom + 1), children: _jsx(Plus, {}) })] })] }), _jsxs("div", { className: "grid min-h-0 flex-1 grid-cols-[5rem_minmax(0,1fr)] gap-x-2 @min-[20rem]:grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)] @min-[20rem]:gap-x-3", style: under ? undefined : { height: AXIS + lanes.length * ROW }, children: [_jsxs("div", { className: "relative flex min-h-0 flex-col", children: [_jsx("span", { className: "flex shrink-0 items-end text-[11px] font-medium tracking-wide text-muted-foreground-strong uppercase", style: { height: AXIS }, children: words.axis }), lanes.map((one) => (_jsxs("span", { className: "flex shrink-0 min-w-0 items-center gap-2", style: { height: ROW }, children: [_jsx("span", { "aria-hidden": "true", className: "size-2 shrink-0 rounded-full", style: { background: one.colour } }), _jsxs("span", { className: "flex min-w-0 flex-col leading-tight", children: [_jsx("span", { title: one.name, className: "truncate text-[12.5px] text-foreground", children: one.name }), _jsx("span", { title: one.sub, className: "truncate text-[11px] text-muted-foreground tabular-nums", children: one.sub })] })] }, one.key))), under?.marks && room.height > 0 ? under.marks(seen) : null] }), _jsxs("div", { ref: lane, tabIndex: most > 0 ? 0 : -1, "aria-label": words.lane, onPointerDown: down, onPointerMove: move, onPointerLeave: () => { setHover(null); drag.current = null; }, onPointerUp: () => { drag.current = null; }, onPointerCancel: () => { drag.current = null; }, onKeyDown: (event) => {
                            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                                event.preventDefault();
                                setShift(Math.min(Math.max(moved + (event.key === "ArrowRight" ? 1 : -1) * width * 3, 0), most));
                            }
                            else if (event.key === "+" || event.key === "=")
                                zoomTo(zoom + 1);
                            else if (event.key === "-")
                                zoomTo(zoom - 1);
                        }, className: cn("relative min-h-0 min-w-0 touch-pan-y overflow-hidden rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", most > 0 && "cursor-grab active:cursor-grabbing"), children: [_jsxs("div", { className: "absolute inset-y-0 left-0", style: { width: span, transform: `translateX(${-moved}px)` }, children: [_jsx("div", { className: "relative border-b border-border/70", style: { height: AXIS }, children: Array.from({ length: months + 1 }, (_, m) => m).filter((m) => m % every === 0).map((m) => (_jsx("span", { style: { left: m * width }, className: "absolute bottom-0 flex h-full items-end border-l border-border/70 pb-1 pl-1 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums", children: tick ? tick(m) : m }, m))) }), lanes.map((one, k) => {
                                        const left = one.start * width, length = Math.max(one.length * width, 4);
                                        const said = one.amount.length * 7;
                                        const after = left + length + 6 + said < span;
                                        const on = !after && left - 6 - said < 0 && length >= said + 10;
                                        return (_jsx("div", { className: "relative border-b border-dashed border-border/50", style: { height: ROW }, children: _jsxs(Popover.Root, { open: open === one.key, onOpenChange: (next) => setOpen(next ? one.key : null), children: [_jsx(Popover.Anchor, { asChild: true, children: _jsx("span", { "aria-hidden": "true", className: "pointer-events-none absolute top-1 size-0", style: { left: left + length / 2 } }) }), _jsx(Button, { variant: "ghost", "aria-label": one.label, onClick: () => setOpen(open === one.key ? null : one.key), className: "group absolute inset-y-0 h-7 rounded-md p-0 hover:bg-transparent", style: { left, width: length }, children: _jsx(motion.span, { "aria-hidden": "true", className: "block h-3 w-full origin-left rounded-md transition-shadow group-hover:shadow-[0_0_0_3px_var(--glow-brand)] group-focus-visible:shadow-[0_0_0_3px_var(--glow-brand)]", style: { background: `linear-gradient(90deg, color-mix(in oklab, ${one.colour} 72%, transparent), ${one.colour})` }, initial: reduce ? false : { scaleX: 0, opacity: 0.4 }, animate: { scaleX: 1, opacity: 1 }, transition: { delay: 0.15 + k * 0.08, duration: 0.55, ease: EASE_OUT } }) }), on ? (_jsx("span", { className: "pointer-events-none absolute inset-y-0 flex items-center", style: { right: span - left - length + 2 }, children: _jsx("span", { className: "rounded-md bg-raised/90 px-1 text-[12.5px] leading-5 whitespace-nowrap text-foreground tabular-nums shadow-sm", children: one.amount }) })) : (_jsx("span", { className: cn("pointer-events-none absolute inset-y-0 flex items-center text-[12.5px] whitespace-nowrap text-foreground tabular-nums", !after && "justify-end"), style: after ? { left: left + length + 6 } : { right: span - left + 6 }, children: one.amount })), _jsx(Popover.Portal, { children: _jsx(Popover.Content, { side: "top", align: "center", sideOffset: 12, className: "z-50 w-64 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-[13.5px] text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", children: one.detail }) })] }) }, one.key));
                                    }), under && room.height > 0 ? under.draw(seen) : null, hover !== null ? (_jsx("span", { "aria-hidden": "true", className: "pointer-events-none absolute inset-y-0 border-l border-foreground/40", style: { left: (hover + 0.5) * width } })) : null] }), hover !== null ? (_jsxs("span", { role: "status", className: "pointer-events-none absolute top-1 z-10 flex flex-col rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-[12.5px] shadow-lg backdrop-blur", style: (hover + 0.5) * width - moved > room.width / 2 ? { right: room.width - ((hover + 0.5) * width - moved) + 12 } : { left: (hover + 0.5) * width - moved + 12 }, children: [_jsxs("span", { className: "font-medium text-foreground", children: [at(hover), phasesOf(hover) ? _jsxs("span", { className: "font-normal text-muted-foreground", children: [" \u00B7 ", phasesOf(hover)] }) : null] }), under?.read ? under.read(hover) : null] })) : null] })] })] }));
}

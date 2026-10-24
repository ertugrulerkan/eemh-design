import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useReducedMotion } from "motion/react";
import { useId } from "react";
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { cn } from "../button/registry/lib/utils.js";
import { ticks, trough } from "./scale.js";
const TOP = 10, BOTTOM = 6;
function placing(flow, view) {
    const low = Math.min(0, ...flow.net, ...flow.total), high = Math.max(0, ...flow.net, ...flow.total);
    const scale = ticks(low, high, 3);
    const [lo, hi] = [scale[0], scale[scale.length - 1]];
    const plot = Math.max(view.height - view.top - TOP - BOTTOM, 1);
    const yOf = (v) => view.top + TOP + ((hi - v) / (hi - lo || 1)) * plot;
    return { scale, lo, hi, yOf, deepest: trough(flow.total) };
}
export function flowUnder(flow, words) {
    return {
        steps: flow.net.length,
        legend: (_jsxs("span", { className: "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground", children: [_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { "aria-hidden": "true", className: "h-2.5 w-1.5 rounded-sm bg-success/70" }), words.in] }), _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { "aria-hidden": "true", className: "h-2.5 w-1.5 rounded-sm bg-destructive/70" }), words.out] }), _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { "aria-hidden": "true", className: "h-0.5 w-4 rounded-full bg-foreground" }), words.total] })] })),
        marks: (view) => {
            const { scale, yOf } = placing(flow, view);
            return scale.map((v) => (_jsx("span", { className: "absolute right-0 flex h-0 items-center text-[11px] text-muted-foreground tabular-nums", style: { top: yOf(v) }, children: flow.short(v) }, v)));
        },
        draw: (view) => _jsx(Money, { flow: flow, words: words, view: view }),
        read: (m) => (_jsxs(_Fragment, { children: [_jsxs("span", { className: "flex justify-between gap-4 text-muted-foreground", children: [words.net, _jsx("span", { className: cn("tabular-nums", (flow.net[m] ?? 0) < 0 ? "text-destructive-ink" : "text-success-ink"), children: flow.whole(flow.net[m] ?? 0) })] }), _jsxs("span", { className: "flex justify-between gap-4 text-muted-foreground", children: [words.total, _jsx("span", { className: "text-foreground tabular-nums", children: flow.whole(flow.total[m] ?? 0) })] })] })),
    };
}
function Money({ flow, words, view }) {
    const reduce = useReducedMotion();
    const id = `flow-${useId().replace(/:/g, "")}`;
    const { scale, lo, hi, yOf, deepest } = placing(flow, view);
    const data = flow.net.map((one, m) => ({ x: m + 0.5, net: one, total: flow.total[m] ?? 0 }));
    const turn = hi === lo ? 0 : hi / (hi - lo);
    const peak = deepest ? words.peak(flow.short(deepest.value), deepest.at) : "";
    const { width, span, hover } = view;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute inset-x-0 bottom-0", style: { top: view.top }, children: _jsx("div", { className: "pointer-events-none flex h-full w-full justify-center text-xs [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-layer]:outline-hidden [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-surface]:outline-hidden", children: _jsx(ResponsiveContainer, { initialDimension: { width: 320, height: 200 }, children: _jsxs(ComposedChart, { data: data, margin: { top: TOP, right: 0, bottom: BOTTOM, left: 0 }, accessibilityLayer: false, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: id, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "var(--success)", stopOpacity: 0.32 }), _jsx("stop", { offset: turn, stopColor: "var(--success)", stopOpacity: 0.04 }), _jsx("stop", { offset: turn, stopColor: "var(--destructive)", stopOpacity: 0.06 }), _jsx("stop", { offset: "1", stopColor: "var(--destructive)", stopOpacity: 0.3 })] }) }), _jsx(CartesianGrid, { vertical: false, strokeDasharray: "2 4" }), _jsx(XAxis, { type: "number", dataKey: "x", domain: [0, view.steps], hide: true }), _jsx(YAxis, { type: "number", domain: [lo, hi], ticks: scale, hide: true }), _jsx(ReferenceLine, { y: 0, stroke: "var(--border-strong)" }), _jsx(Area, { dataKey: "total", type: "monotone", stroke: "none", fill: `url(#${id})`, isAnimationActive: !reduce, animationDuration: 1100 }), _jsx(Bar, { dataKey: "net", barSize: Math.max(width * 0.58, 1.5), radius: 2, isAnimationActive: !reduce, animationDuration: 650, children: data.map((one, m) => _jsx(Cell, { fill: one.net >= 0 ? "var(--success)" : "var(--destructive)", fillOpacity: hover === null || hover === m ? 0.75 : 0.35 }, m)) }), _jsx(Line, { dataKey: "total", type: "monotone", stroke: "var(--foreground)", strokeWidth: 2, dot: false, isAnimationActive: !reduce, animationDuration: 1200 }), deepest ? _jsx(ReferenceDot, { x: deepest.at + 0.5, y: deepest.value, r: 4, fill: "var(--brand)", stroke: "var(--raised)", strokeWidth: 2 }) : null] }) }) }) }), deepest ? (_jsxs(_Fragment, { children: [_jsx("span", { "aria-hidden": "true", className: "pointer-events-none absolute size-4 animate-peak rounded-full border-2 border-brand opacity-0 motion-reduce:animate-none", style: { left: (deepest.at + 0.5) * width - 8, top: yOf(deepest.value) - 8 } }), _jsx("span", { className: "pointer-events-none absolute rounded-lg border border-brand/40 bg-raised/90 px-2 text-[11px] leading-5 text-brand-ink tabular-nums shadow-sm backdrop-blur", style: { bottom: view.height - yOf(deepest.value) + 10, maxWidth: Math.max(span - 4, 80),
                            left: Math.min(Math.max((deepest.at + 0.5) * width - peak.length * 3.1 - 9, 2), Math.max(span - peak.length * 6.2 - 20, 2)) }, children: peak })] })) : null] }));
}

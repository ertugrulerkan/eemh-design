import { useReducedMotion } from "motion/react";
import { useId } from "react";
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { cn } from "../button/registry/lib/utils.js";
import type { Under, View } from "./index.js";
import { ticks, trough } from "./scale.js";

/* The money under the lanes (the Aldo cockpit's, eemh-design/lanes `under`), on the lanes' own months: each month's money as a
   column (in above the line, out below it) with the running total drawn over it, its deepest point marked, the most money the work
   needs before it pays back; the total draws itself when the answer comes, still where motion is asked to be reduced. Apart from the
   lanes so a lane drawn without money (Render's queue, a run's steps) carries no chart library. */
export type Flow = { net: number[]; total: number[]; short: (n: number) => string; whole: (n: number) => string };

/* The words the money says: its two lines' names, its key's in and out, and its deepest point with its value and month in words. */
export type FlowWords = { net: string; total: string; in: string; out: string; peak: (value: string, month: number) => string };

const TOP = 10, BOTTOM = 6;

/* Where the money stands on the strip: its round values, their ends, the height of each, the plot's height, its deepest point. */
function placing(flow: Flow, view: View) {
  const low = Math.min(0, ...flow.net, ...flow.total), high = Math.max(0, ...flow.net, ...flow.total);
  const scale = ticks(low, high, 3);
  const [lo, hi] = [scale[0], scale[scale.length - 1]];
  const plot = Math.max(view.height - view.top - TOP - BOTTOM, 1);
  const yOf = (v: number) => view.top + TOP + ((hi - v) / (hi - lo || 1)) * plot;
  return { scale, lo, hi, yOf, plot, deepest: trough(flow.total) };
}

export function flowUnder(flow: Flow, words: FlowWords): Under {
  return {
    steps: flow.net.length,
    legend: (
      <span className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-1.5 rounded-sm bg-success/70" />{words.in}</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-1.5 rounded-sm bg-destructive/70" />{words.out}</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-foreground" />{words.total}</span>
      </span>
    ),
    marks: (view) => {
      const { scale, yOf } = placing(flow, view);
      return scale.map((v) => (
        <span key={v} className="absolute right-0 flex h-0 items-center text-[11px] text-muted-foreground tabular-nums" style={{ top: yOf(v) }}>{flow.short(v)}</span>
      ));
    },
    draw: (view) => <Money flow={flow} words={words} view={view} />,
    read: (m) => (
      <>
        <span className="flex justify-between gap-4 text-muted-foreground">{words.net}<span className={cn("tabular-nums", (flow.net[m] ?? 0) < 0 ? "text-destructive-ink" : "text-success-ink")}>{flow.whole(flow.net[m] ?? 0)}</span></span>
        <span className="flex justify-between gap-4 text-muted-foreground">{words.total}<span className="text-foreground tabular-nums">{flow.whole(flow.total[m] ?? 0)}</span></span>
      </>
    ),
  };
}

function Money({ flow, words, view }: { flow: Flow; words: FlowWords; view: View }) {
  const reduce = useReducedMotion();
  const id = `flow-${useId().replace(/:/g, "")}`;
  const { scale, lo, hi, yOf, plot, deepest } = placing(flow, view);
  const data = flow.net.map((one, m) => ({ x: m + 0.5, net: one, total: flow.total[m] ?? 0 }));
  // the total above nought in the gain's colour, under it in the loss's: the gradient spans the plot, the axis' top to its foot as
  // the chart lays them, so it turns where nought stands (on the area's own box, the default, it turned wherever the total's own
  // ends put it: a total never under nought drew its lowest third in the loss's colour)
  const turn = hi === lo ? 0 : hi / (hi - lo);
  const peak = deepest ? words.peak(flow.short(deepest.value), deepest.at) : "";
  const { width, span, hover } = view;
  return (
    <>
      <div className="absolute inset-x-0 bottom-0" style={{ top: view.top }}>
        {/* drawn as shadcn's chart draws (the rooms' ui/chart): its grid and nought in the border's tone, no outline on a layer */}
        <div className="pointer-events-none flex h-full w-full justify-center text-xs [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-layer]:outline-hidden [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-surface]:outline-hidden">
          <ResponsiveContainer initialDimension={{ width: 320, height: 200 }}>
            <ComposedChart data={data} margin={{ top: TOP, right: 0, bottom: BOTTOM, left: 0 }} accessibilityLayer={false}>
              <defs>
                <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={TOP} x2="0" y2={TOP + plot}>
                  <stop offset="0" stopColor="var(--success)" stopOpacity={0.32} />
                  <stop offset={turn} stopColor="var(--success)" stopOpacity={0.04} />
                  <stop offset={turn} stopColor="var(--destructive)" stopOpacity={0.06} />
                  <stop offset="1" stopColor="var(--destructive)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
              <XAxis type="number" dataKey="x" domain={[0, view.steps]} hide />
              <YAxis type="number" domain={[lo, hi]} ticks={scale} hide />
              <ReferenceLine y={0} stroke="var(--border-strong)" />
              <Area dataKey="total" type="monotone" stroke="none" fill={`url(#${id})`} isAnimationActive={!reduce} animationDuration={1100} />
              <Bar dataKey="net" barSize={Math.max(width * 0.58, 1.5)} radius={2} isAnimationActive={!reduce} animationDuration={650}>
                {data.map((one, m) => <Cell key={m} fill={one.net >= 0 ? "var(--success)" : "var(--destructive)"} fillOpacity={hover === null || hover === m ? 0.75 : 0.35} />)}
              </Bar>
              <Line dataKey="total" type="monotone" stroke="var(--foreground)" strokeWidth={2} dot={false} isAnimationActive={!reduce} animationDuration={1200} />
              {deepest ? <ReferenceDot x={deepest.at + 0.5} y={deepest.value} r={4} fill="var(--brand)" stroke="var(--raised)" strokeWidth={2} /> : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* the deepest point said where it stands: a ring that breathes out three times when the answer comes (--animate-peak), none
          where motion is asked to be reduced, its words beside it */}
      {deepest ? (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute size-4 animate-peak rounded-full border-2 border-brand opacity-0 motion-reduce:animate-none"
            style={{ left: (deepest.at + 0.5) * width - 8, top: yOf(deepest.value) - 8 }} />
          <span className="pointer-events-none absolute rounded-lg border border-brand/40 bg-raised/90 px-2 text-[11px] leading-5 text-brand-ink tabular-nums shadow-sm backdrop-blur"
            style={{ bottom: view.height - yOf(deepest.value) + 10, maxWidth: Math.max(span - 4, 80),
              left: Math.min(Math.max((deepest.at + 0.5) * width - peak.length * 3.1 - 9, 2), Math.max(span - peak.length * 6.2 - 20, 2)) }}>
            {peak}
          </span>
        </>
      ) : null}
    </>
  );
}

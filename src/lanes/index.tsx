import { Minus, Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Popover } from "radix-ui";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Button } from "../button/index.js";
import { EASE_OUT } from "../button/registry/lib/ease.js";
import { cn } from "../button/registry/lib/utils.js";
import { AT_ONE, everyTick, monthAt, ROUND_TICKS, ZOOMS } from "./scale.js";

export { AT_ONE, everyTick, monthAt, MONTH_TICKS, ROUND_TICKS, RUN_STEPS, secondsOf, STEPS_MS, tickOf, ticks, timed, trough, ZOOMS } from "./scale.js";

/* Time as the rooms draw it, the panel's trace waterfall (the owner's example, 22-23.10.2026: kobra.systems' trace waterfall): a row
   for each stretch of work, its bar from its first step for its steps with what it costs, brings or took beside it. One axis,
   drawn at half to four times its width (the buttons, Ctrl and the wheel), moved by a drag or the arrow keys, never a scroll bar; the
   pointer names the step under it and a bar opens what it holds. The bars grow from their first step, still where motion is asked
   to be reduced. Its axis is any time's: `at` a step of it in words, `tick` its written steps (none: their numbers, by the quarter
   and the year, as months are written), `words.axis` its name.
   What a room draws under the lanes on the same axis (the Aldo cockpit's money, `eemh-design/lanes/flow`) comes in as `under`: its
   steps, its key at the lanes' head, its values in the names' column, itself on the moving strip and its lines where the pointer
   reads a step. Without it the lanes stand as high as their rows.
   Moved from the panel's cockpit (src/panel/cockpit/TimeLanes.tsx) in v0.8.0 so the panel and Render draw one; the words come from
   the room, in its language. */
export type Lane = { key: string; name: string; sub: string; start: number; length: number; amount: string; colour: string; label: string; detail: ReactNode };

/* The words the lanes say themselves: the axis' name, what the strip is to a screen reader, and the two zoom buttons'. */
export type LaneWords = { axis: string; lane: string; zoomIn: string; zoomOut: string };

/* Where a layer under the lanes stands: the axis' steps and a step's width, the strip's whole width, the step under the pointer, and
   the strip's height with where the lanes end on it (px). */
export type View = { steps: number; width: number; span: number; hover: number | null; top: number; height: number };
export type Under = {
  steps: number;
  legend?: ReactNode;
  marks?: (view: View) => ReactNode;
  draw: (view: View) => ReactNode;
  read?: (step: number) => ReactNode;
};

const ROW = 28;
const AXIS = 24;

export function TimeLanes({ lanes, at, tick, words, locale, under }: {
  lanes: Lane[];
  // the words of a step of the axis the room's owner counts from (month 0 the land's purchase, second 0 a run's start) and the
  // words its steps are written in under it
  at: (step: number) => string; tick?: (step: number) => string;
  words: LaneWords; locale: string; under?: Under;
}) {
  const reduce = useReducedMotion();
  const months = Math.ceil(Math.max(under?.steps ?? 0, ...lanes.map((one) => one.start + one.length), 1));
  const lane = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const box = lane.current;
    if (!box) return;
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
  // a nearer or farther view keeps the step in the middle where it stood
  const zoomTo = (next: number) => {
    const to = Math.min(ZOOMS.length - 1, Math.max(0, next));
    if (to === zoom || !room.width) return;
    const middle = (moved + room.width / 2) / width;
    const after = (room.width / Math.max(months, 1)) * ZOOMS[to];
    setZoom(to);
    setShift(middle * after - room.width / 2);
  };
  // the latest view, for the wheel's listener (added once, not passive, so the page does not zoom instead)
  const view = useRef({ zoomTo, zoom });
  view.current = { zoomTo, zoom };
  useEffect(() => {
    const box = lane.current;
    if (!box) return;
    let turned = 0;
    // Ctrl and the wheel draw it nearer or farther, as a drawing is; the wheel alone is the page's
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      turned += event.deltaY;
      if (Math.abs(turned) < 40) return;
      view.current.zoomTo(view.current.zoom + (turned < 0 ? 1 : -1));
      turned = 0;
    };
    box.addEventListener("wheel", wheel, { passive: false });
    return () => box.removeEventListener("wheel", wheel);
  }, []);

  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const drag = useRef<{ x: number; from: number } | null>(null);
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (most <= 0 || (event.target as HTMLElement).closest("button")) return;
    drag.current = { x: event.clientX, from: moved };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (drag.current) setShift(Math.min(Math.max(drag.current.from - (event.clientX - drag.current.x), 0), most));
    if (width > 0) setHover(monthAt(event.clientX - box.left, moved, width, months));
  };

  const every = tick ? everyTick(width, tick(months).length * 6.5 + 12, ROUND_TICKS) : everyTick(width);
  const phasesOf = (m: number) => lanes.filter((one) => m + 1 > one.start && m < one.start + one.length).map((one) => one.name).join(" · ");
  const seen: View = { steps: months, width, span, hover, top: AXIS + lanes.length * ROW, height: room.height };

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", under && "flex-1")}>
      <div className="flex min-h-7 items-center justify-between gap-3">
        {under?.legend ?? <span />}
        <span className="flex shrink-0 items-center gap-1">
          <Button size="icon" variant="ghost" aria-label={words.zoomOut} disabled={zoom === 0} onClick={() => zoomTo(zoom - 1)}><Minus /></Button>
          <span className="w-10 text-center text-[12.5px] text-muted-foreground tabular-nums">{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(ZOOMS[zoom])}×</span>
          <Button size="icon" variant="ghost" aria-label={words.zoomIn} disabled={zoom === ZOOMS.length - 1} onClick={() => zoomTo(zoom + 1)}><Plus /></Button>
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)] gap-x-3"
        style={under ? undefined : { height: AXIS + lanes.length * ROW }}>
        {/* the rows' names, and what is drawn under them marked at its height */}
        <div className="relative flex min-h-0 flex-col">
          <span className="flex shrink-0 items-end text-[11px] font-medium tracking-wide text-muted-foreground-strong uppercase" style={{ height: AXIS }}>{words.axis}</span>
          {lanes.map((one) => (
            <span key={one.key} className="flex shrink-0 min-w-0 items-center gap-2" style={{ height: ROW }}>
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: one.colour }} />
              <span className="flex min-w-0 flex-col leading-tight">
                <span title={one.name} className="truncate text-[12.5px] text-foreground">{one.name}</span>
                <span title={one.sub} className="truncate text-[11px] text-muted-foreground tabular-nums">{one.sub}</span>
              </span>
            </span>
          ))}
          {under?.marks && room.height > 0 ? under.marks(seen) : null}
        </div>
        <div ref={lane} tabIndex={most > 0 ? 0 : -1} aria-label={words.lane}
          onPointerDown={down} onPointerMove={move} onPointerLeave={() => { setHover(null); drag.current = null; }}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              setShift(Math.min(Math.max(moved + (event.key === "ArrowRight" ? 1 : -1) * width * 3, 0), most));
            } else if (event.key === "+" || event.key === "=") zoomTo(zoom + 1);
            else if (event.key === "-") zoomTo(zoom - 1);
          }}
          className={cn("relative min-h-0 min-w-0 touch-pan-y overflow-hidden rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            most > 0 && "cursor-grab active:cursor-grabbing")}>
          <div className="absolute inset-y-0 left-0" style={{ width: span, transform: `translateX(${-moved}px)` }}>
            {/* every month a tick, every few its number (any other time's step its words) */}
            <div className="relative border-b border-border/70" style={{ height: AXIS }}>
              {Array.from({ length: months + 1 }, (_, m) => m).filter((m) => m % every === 0).map((m) => (
                <span key={m} style={{ left: m * width }} className="absolute bottom-0 flex h-full items-end border-l border-border/70 pb-1 pl-1 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">{tick ? tick(m) : m}</span>
              ))}
            </div>
            {lanes.map((one, k) => {
              const left = one.start * width, length = Math.max(one.length * width, 4);
              // its figure after its end, or before its start where the lane ends first, or on the bar's end where neither side has room
              // (a long bar in a narrow lane, a phone's)
              const said = one.amount.length * 7;
              const after = left + length + 6 + said < span;
              const on = !after && left - 6 - said < 0 && length >= said + 10;
              return (
                <div key={one.key} className="relative border-b border-dashed border-border/50" style={{ height: ROW }}>
                  <Popover.Root open={open === one.key} onOpenChange={(next) => setOpen(next ? one.key : null)}>
                    <Popover.Anchor asChild><span aria-hidden="true" className="pointer-events-none absolute top-1 size-0" style={{ left: left + length / 2 }} /></Popover.Anchor>
                    <Button variant="ghost" aria-label={one.label} onClick={() => setOpen(open === one.key ? null : one.key)}
                      className="group absolute inset-y-0 h-7 rounded-md p-0 hover:bg-transparent" style={{ left, width: length }}>
                      <motion.span aria-hidden="true" className="block h-3 w-full origin-left rounded-md transition-shadow group-hover:shadow-[0_0_0_3px_var(--glow-brand)] group-focus-visible:shadow-[0_0_0_3px_var(--glow-brand)]"
                        style={{ background: `linear-gradient(90deg, color-mix(in oklab, ${one.colour} 72%, transparent), ${one.colour})` }}
                        initial={reduce ? false : { scaleX: 0, opacity: 0.4 }} animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: 0.15 + k * 0.08, duration: 0.55, ease: EASE_OUT }} />
                    </Button>
                    {on ? (
                      <span className="pointer-events-none absolute inset-y-0 flex items-center" style={{ right: span - left - length + 2 }}>
                        <span className="rounded-md bg-raised/90 px-1 text-[12.5px] leading-5 whitespace-nowrap text-foreground tabular-nums shadow-sm">{one.amount}</span>
                      </span>
                    ) : (
                      <span className={cn("pointer-events-none absolute inset-y-0 flex items-center text-[12.5px] whitespace-nowrap text-foreground tabular-nums", !after && "justify-end")}
                        style={after ? { left: left + length + 6 } : { right: span - left + 6 }}>{one.amount}</span>
                    )}
                    {/* a bar's card, drawn as shadcn's popover is (the rooms' popover, ui/popover) */}
                    <Popover.Portal>
                      <Popover.Content side="top" align="center" sideOffset={12}
                        className="z-50 w-64 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-[13.5px] text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                        {one.detail}
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </div>
              );
            })}
            {under && room.height > 0 ? under.draw(seen) : null}
            {/* the step under the pointer, across the rows and what lies under them */}
            {hover !== null ? (
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 border-l border-foreground/40" style={{ left: (hover + 0.5) * width }} />
            ) : null}
          </div>
          {hover !== null ? (
            <span role="status" className="pointer-events-none absolute top-1 z-10 flex flex-col rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-[12.5px] shadow-lg backdrop-blur"
              style={(hover + 0.5) * width - moved > room.width / 2 ? { right: room.width - ((hover + 0.5) * width - moved) + 12 } : { left: (hover + 0.5) * width - moved + 12 }}>
              <span className="font-medium text-foreground">{at(hover)}{phasesOf(hover) ? <span className="font-normal text-muted-foreground"> · {phasesOf(hover)}</span> : null}</span>
              {under?.read ? under.read(hover) : null}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

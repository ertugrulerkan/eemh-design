/* A time lane's arithmetic, framework-free (test/lanes.test.mjs): the steps a lane is drawn at, the round values of an axis, the
   deepest a running total goes, the step under a point, and a run's spans laid on its own clock. Nothing here computes a room's
   figures; it places the figures a room's owner answered. Moved from the panel's cockpit (src/panel/cockpit/scale.ts) so the panel
   and Render draw one lane (v0.8.0). */

/* How near a time lane is drawn: half to four times the width its whole span fills, each step √2 from the next. */
export const ZOOMS = [0.5, 0.71, 1, 1.41, 2, 2.83, 4];
export const AT_ONE = 2;

/* Round values for an axis that holds low and high: steps of 1, 2, 2.5 or 5 times a power of ten, about `count` of them, the first at or
   under low and the last at or over high. */
export function ticks(low: number, high: number, count = 5): number[] {
  const span = high - low || 1;
  const raw = span / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((one) => one >= raw)!;
  const first = Math.floor(low / step + 1e-9) * step, last = Math.ceil(high / step - 1e-9) * step;
  return Array.from({ length: Math.round((last - first) / step) + 1 }, (_, k) => first + k * step);
}

/* Every how many steps a lane writes its step, so two words stand at least `least` px apart: months by the quarter and the year,
   any other time by the round tens. */
export const MONTH_TICKS = [1, 2, 3, 6, 12, 24];
export const ROUND_TICKS = [1, 2, 5, 10, 20, 50, 100];
export function everyTick(width: number, least = 30, among: readonly number[] = MONTH_TICKS): number {
  return among.find((n) => n * width >= least) ?? among[among.length - 1];
}

/* The deepest a running total goes under nought and the month it does (the most money a project needs before it pays back), none
   where it never goes under. */
export function trough(totals: number[]): { at: number; value: number } | null {
  let at = -1;
  totals.forEach((one, k) => { if (one < 0 && (at < 0 || one < totals[at])) at = k; });
  return at < 0 ? null : { at, value: totals[at] };
}

/* The step under a point of a lane drawn `width` px a step, moved `moved` px along, within its steps. */
export function monthAt(x: number, moved: number, width: number, months: number): number {
  return Math.min(months - 1, Math.max(0, Math.floor((x + moved) / Math.max(width, 1e-9))));
}

/* The steps a run's clock is counted in, in milliseconds: the first that lays the whole run in at most RUN_STEPS of them, so a run
   of a second and one of an hour each read across their own few dozen ticks. */
export const STEPS_MS = [10, 50, 100, 500, 1_000, 5_000, 10_000, 30_000, 60_000, 300_000, 600_000, 1_800_000, 3_600_000];
export const RUN_STEPS = 48;

/* What ran, laid on its run's own clock (the automation room's steps, Render's queue): each where it began, in `unit` ms steps from
   the run's start (`begun`, or the first that began), for as long as it took, in the order they began, and how long the whole took
   (ms). One whose times are not both known, or that ended before it began, is left off; none where nothing is left. */
export function timed<T>(items: readonly T[], span: (item: T) => { from: number; to: number }, begun?: number):
  { unit: number; steps: number; whole: number; timed: { item: T; start: number; length: number }[] } | null {
  const ran = items.map((item) => ({ item, ...span(item) }))
    .filter((one) => Number.isFinite(one.from) && Number.isFinite(one.to) && one.to >= one.from);
  if (!ran.length) return null;
  const zero = Math.min(...ran.map((one) => one.from), ...(begun !== undefined && Number.isFinite(begun) ? [begun] : []));
  const whole = Math.max(...ran.map((one) => one.to)) - zero;
  const unit = STEPS_MS.find((step) => whole / step <= RUN_STEPS) ?? STEPS_MS[STEPS_MS.length - 1];
  const timed = ran.sort((a, b) => a.from - b.from).map((one) => ({ item: one.item, start: (one.from - zero) / unit, length: (one.to - one.from) / unit }));
  return { unit, steps: Math.max(1, Math.ceil(whole / unit)), whole, timed };
}

/* How long something took, in seconds as the rooms write them (two decimals under ten, as rounded: 9.996 s is ten and written as
   ten is); none where it is not known. */
export function secondsOf(ms: number, locale: string): string {
  const took = ms / 1000;
  if (!Number.isFinite(took)) return "";
  const digits = Math.abs(Number(took.toLocaleString("en", { maximumFractionDigits: 2, useGrouping: false }))) < 10 ? 2 : 0;
  return took.toLocaleString(locale, { style: "unit", unit: "second", unitDisplay: "narrow", minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/* A tick of a run's clock in words: its time from the run's start, every tick in the one unit (s, min, h) its step is counted in. */
export function tickOf(step: number, unit: number, locale: string): string {
  const ms = step * unit;
  const [value, name] = unit >= 3_600_000 ? [ms / 3_600_000, "hour"] : unit >= 60_000 ? [ms / 60_000, "minute"] : [ms / 1000, "second"];
  return value.toLocaleString(locale, { style: "unit", unit: name, unitDisplay: "narrow", maximumFractionDigits: 2 });
}

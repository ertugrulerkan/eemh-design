export const ZOOMS = [0.5, 0.71, 1, 1.41, 2, 2.83, 4];
export const AT_ONE = 2;
export function ticks(low, high, count = 5) {
    const span = high - low || 1;
    const raw = span / count;
    const power = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((one) => one >= raw);
    const first = Math.floor(low / step + 1e-9) * step, last = Math.ceil(high / step - 1e-9) * step;
    return Array.from({ length: Math.round((last - first) / step) + 1 }, (_, k) => first + k * step);
}
export const MONTH_TICKS = [1, 2, 3, 6, 12, 24];
export const ROUND_TICKS = [1, 2, 5, 10, 20, 50, 100];
export function everyTick(width, least = 30, among = MONTH_TICKS) {
    return among.find((n) => n * width >= least) ?? among[among.length - 1];
}
export function trough(totals) {
    let at = -1;
    totals.forEach((one, k) => { if (one < 0 && (at < 0 || one < totals[at]))
        at = k; });
    return at < 0 ? null : { at, value: totals[at] };
}
export function monthAt(x, moved, width, months) {
    return Math.min(months - 1, Math.max(0, Math.floor((x + moved) / Math.max(width, 1e-9))));
}
export const STEPS_MS = [10, 50, 100, 500, 1_000, 5_000, 10_000, 30_000, 60_000, 300_000, 600_000, 1_800_000, 3_600_000];
export const RUN_STEPS = 48;
export function timed(items, span, begun) {
    const ran = items.map((item) => ({ item, ...span(item) }))
        .filter((one) => Number.isFinite(one.from) && Number.isFinite(one.to) && one.to >= one.from);
    if (!ran.length)
        return null;
    const zero = Math.min(...ran.map((one) => one.from), ...(begun !== undefined && Number.isFinite(begun) ? [begun] : []));
    const whole = Math.max(...ran.map((one) => one.to)) - zero;
    const unit = STEPS_MS.find((step) => whole / step <= RUN_STEPS) ?? STEPS_MS[STEPS_MS.length - 1];
    const timed = ran.sort((a, b) => a.from - b.from).map((one) => ({ item: one.item, start: (one.from - zero) / unit, length: (one.to - one.from) / unit }));
    return { unit, steps: Math.max(1, Math.ceil(whole / unit)), whole, timed };
}
export function secondsOf(ms, locale) {
    const took = ms / 1000;
    const digits = took < 10 ? 2 : 0;
    return Number.isFinite(took) ? took.toLocaleString(locale, { style: "unit", unit: "second", unitDisplay: "narrow", minimumFractionDigits: digits, maximumFractionDigits: digits }) : "";
}
export function tickOf(step, unit, locale) {
    const ms = step * unit;
    const [value, name] = unit >= 3_600_000 ? [ms / 3_600_000, "hour"] : unit >= 60_000 ? [ms / 60_000, "minute"] : [ms / 1000, "second"];
    return value.toLocaleString(locale, { style: "unit", unit: name, unitDisplay: "narrow", maximumFractionDigits: 2 });
}

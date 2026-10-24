export declare const ZOOMS: number[];
export declare const AT_ONE = 2;
export declare function ticks(low: number, high: number, count?: number): number[];
export declare const MONTH_TICKS: number[];
export declare const ROUND_TICKS: number[];
export declare function everyTick(width: number, least?: number, among?: readonly number[]): number;
export declare function trough(totals: number[]): {
    at: number;
    value: number;
} | null;
export declare function monthAt(x: number, moved: number, width: number, months: number): number;
export declare const STEPS_MS: number[];
export declare const RUN_STEPS = 48;
export declare function timed<T>(items: readonly T[], span: (item: T) => {
    from: number;
    to: number;
}, begun?: number): {
    unit: number;
    steps: number;
    whole: number;
    timed: {
        item: T;
        start: number;
        length: number;
    }[];
} | null;
export declare function secondsOf(ms: number, locale: string): string;
export declare function tickOf(step: number, unit: number, locale: string): string;

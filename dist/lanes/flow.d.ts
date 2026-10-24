import type { Under } from "./index.js";
export type Flow = {
    net: number[];
    total: number[];
    short: (n: number) => string;
    whole: (n: number) => string;
};
export type FlowWords = {
    net: string;
    total: string;
    in: string;
    out: string;
    peak: (value: string, month: number) => string;
};
export declare function flowUnder(flow: Flow, words: FlowWords): Under;

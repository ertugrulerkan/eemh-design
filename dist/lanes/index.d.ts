import { type ReactNode } from "react";
export { AT_ONE, everyTick, monthAt, MONTH_TICKS, ROUND_TICKS, RUN_STEPS, secondsOf, STEPS_MS, tickOf, ticks, timed, trough, ZOOMS } from "./scale.js";
export type Lane = {
    key: string;
    name: string;
    sub: string;
    start: number;
    length: number;
    amount: string;
    colour: string;
    label: string;
    detail: ReactNode;
};
export type LaneWords = {
    axis: string;
    lane: string;
    zoomIn: string;
    zoomOut: string;
};
export type View = {
    steps: number;
    width: number;
    span: number;
    hover: number | null;
    top: number;
    height: number;
};
export type Under = {
    steps: number;
    legend?: ReactNode;
    marks?: (view: View) => ReactNode;
    draw: (view: View) => ReactNode;
    read?: (step: number) => ReactNode;
};
export declare function TimeLanes({ lanes, at, tick, words, locale, under }: {
    lanes: Lane[];
    at: (step: number) => string;
    tick?: (step: number) => string;
    words: LaneWords;
    locale: string;
    under?: Under;
}): import("react").JSX.Element;

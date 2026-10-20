export declare const EASE_OUT: readonly [0.16, 1, 0.3, 1];
export declare const EASE_IN_OUT: readonly [0.77, 0, 0.175, 1];
export declare const EASE_DRAWER: readonly [0.32, 0.72, 0, 1];
/** CSS string form of EASE_OUT for inline style transitions. */
export declare const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
/** Press feedback on buttons and other tappable surfaces. */
export declare const SPRING_PRESS: {
    readonly type: "spring";
    readonly stiffness: 500;
    readonly damping: 30;
    readonly mass: 0.6;
};
/** Content swaps — label/icon slots trading places inside a control. */
export declare const SPRING_SWAP: {
    readonly type: "spring";
    readonly stiffness: 460;
    readonly damping: 30;
    readonly mass: 0.55;
};
/** Overlay panel entrances — modals and sheets summoned by pointer. */
export declare const SPRING_PANEL: {
    readonly type: "spring";
    readonly stiffness: 420;
    readonly damping: 40;
    readonly mass: 0.5;
};
/** Shared-layout glides — pills, indicators and panels morphing between positions. */
export declare const SPRING_LAYOUT: {
    readonly type: "spring";
    readonly stiffness: 360;
    readonly damping: 32;
    readonly mass: 0.6;
};
/** Cursor-follow physics for decorative mouse tracking (magnetic, tilt, dock). */
export declare const SPRING_MOUSE: {
    readonly stiffness: 200;
    readonly damping: 15;
    readonly mass: 0.3;
};
/** Dragged handles and fills (sliders) — critically damped `useSpring` config,
 * so the value follows the pointer butterily and never rebounds off an end. */
export declare const SPRING_GLIDE: {
    readonly stiffness: 700;
    readonly damping: 50;
    readonly mass: 0.5;
};

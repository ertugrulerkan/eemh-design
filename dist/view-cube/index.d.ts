import { Quaternion, Vector3, WebGLRenderer, type WebGLRendererParameters } from "three";
export interface ViewCubeLook {
    size: number;
    font: string;
    labels: {
        front: string;
        back: string;
        left: string;
        right: string;
        top: string;
        bottom: string;
    };
    compass: {
        n: string;
        e: string;
        s: string;
        w: string;
    };
    face: string;
    text: string;
    edge: string;
    hover: string;
    ring: string;
    ringText: string;
}
export interface ViewCubeHandlers {
    pick(direction: Vector3): void;
    orbit(dx: number, dy: number): void;
    orbitStart(): void;
    orbitEnd(): void;
}
export declare function cubeZone(point: Vector3): Vector3;
export declare class ViewCube {
    private handlers;
    readonly canvas: HTMLCanvasElement;
    private renderer;
    private scene;
    private camera;
    private cube;
    private edges;
    private ring;
    private lit;
    private litMaterial;
    private patch;
    private hovered;
    private turned;
    private dirty;
    private size;
    private press;
    private ray;
    constructor(handlers: ViewCubeHandlers, renderer?: (options: WebGLRendererParameters) => WebGLRenderer);
    style(look: ViewCubeLook): void;
    setNorth(degrees: number): void;
    render(orientation: Quaternion): void;
    dispose(): void;
    private zoneAt;
    private light;
    private onMove;
    private onDown;
    private onUp;
    private onLeave;
}
export declare const CUBE_SIZE = 116;
export declare const CUBE_TOKENS: {
    light: {
        card: string;
        foreground: string;
        border: string;
        brand: string;
    };
    dark: {
        card: string;
        foreground: string;
        border: string;
        brand: string;
    };
};
export declare function cubeLook(options: {
    dark: boolean;
    labels: ViewCubeLook["labels"];
    compass: ViewCubeLook["compass"];
    resolve: (css: string) => string;
}): ViewCubeLook;
export declare function cssColor(where: HTMLElement, css: string): string;
export declare function isDark(where: HTMLElement): boolean;

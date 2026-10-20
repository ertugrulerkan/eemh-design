export declare const KEYBOARD_PRESS: string;
export declare const MOTION_KEYBOARD_SHA256 = "77a72938f56fa301583a29c3cbea8877eabf557437ac902619b54e67f17cc24a";
export declare function pressKeyboard(): {
    name: string;
    enforce: "pre";
    load(id: string): string | null;
};

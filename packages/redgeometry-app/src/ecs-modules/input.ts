import { assertUnreachable } from "redgeometry/src/utility/debug";
import type { Enum } from "redgeometry/src/utility/types";
import type { DefaultSystemStage, WorldModule, WorldPlugin } from "../ecs/types.ts";
import type { World } from "../ecs/world.ts";

export type InputInitData = {
    dataId: "input-init-data";
    keyboardEventHandler: GlobalEventHandlers | undefined;
    mouseEventHandler: GlobalEventHandlers | undefined;
};

type InputCaptureData = {
    dataId: "input-capture-data";
    keyboardButtonEvents: InputKeyboardButtonEvent[];
    mouseButtonEvents: InputMouseButtonEvent[];
    mouseMotionEvents: InputMouseMotionEvent[];
    mouseWheelEvents: InputMouseWheelEvent[];
};

export type InputKeyboardButtonEvent = {
    eventId: "input-keyboard-button-event";
    type: "keyup" | "keydown";
    code: string;
    isComposing: boolean;
    key: string;
    location: number;
    repeat: boolean;
};

export type InputMouseMotionEvent = {
    eventId: "input-mouse-motion-event";
    type: "mouseenter" | "mouseleave" | "mousemove" | "mouseout" | "mouseover";
    clientX: number;
    clientY: number;
    movementX: number;
    movementY: number;
    offsetX: number;
    offsetY: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
};

export type InputMouseButtonEvent = {
    eventId: "input-mouse-button-event";
    type: "mousedown" | "mouseup";
    button: number;
};

export type InputMouseWheelEvent = {
    eventId: "input-mouse-wheel-event";
    type: "wheel";
    deltaX: number;
    deltaY: number;
    deltaZ: number;
    deltaMode: number;
};

export type InputMouseCursorPosition = {
    x: number;
    y: number;
};

type CodeState = {
    code: string;
    state: ButtonState;
};

export const KeyboardButtons = {
    DIGIT_1: 0,
    DIGIT_2: 1,
    DIGIT_3: 2,
    DIGIT_4: 3,
    DIGIT_5: 4,
    DIGIT_6: 5,
    DIGIT_7: 6,
    DIGIT_8: 7,
    DIGIT_9: 8,
    KEY_A: 9,
    KEY_B: 10,
    KEY_C: 11,
    KEY_D: 12,
    KEY_E: 13,
    KEY_F: 14,
    KEY_G: 15,
    KEY_H: 16,
    KEY_I: 17,
    KEY_J: 18,
    KEY_K: 19,
    KEY_L: 20,
    KEY_M: 21,
    KEY_N: 22,
    KEY_O: 23,
    KEY_P: 24,
    KEY_Q: 25,
    KEY_R: 26,
    KEY_S: 27,
    KEY_T: 28,
    KEY_U: 29,
    KEY_V: 30,
    KEY_W: 31,
    KEY_X: 32,
    KEY_Y: 33,
    KEY_Z: 34,
    SHIFT_LEFT: 35,
    SPACE: 36,
} as const;
export type KeyboardButtons = Enum<typeof KeyboardButtons>;

export const MouseButtons = {
    MOUSE_1: 0,
    MOUSE_2: 1,
    MOUSE_3: 2,
    MOUSE_4: 3,
    MOUSE_5: 4,
} as const;
export type MouseButtons = Enum<typeof MouseButtons>;

const ButtonState = {
    None: 0,
    Pressed: 1,
    Pressing: 2,
    Released: 3,
} as const;
type ButtonState = Enum<typeof ButtonState>;

const MOUSE_BUTTONS_LOOKUP: Record<number, MouseButtons> = {
    0: MouseButtons.MOUSE_1,
    1: MouseButtons.MOUSE_3,
    2: MouseButtons.MOUSE_2,
    3: MouseButtons.MOUSE_4,
    4: MouseButtons.MOUSE_5,
};

const KEYBOARD_BUTTONS_LOOKUP: Record<string, KeyboardButtons> = {
    Digit1: KeyboardButtons.DIGIT_1,
    Digit2: KeyboardButtons.DIGIT_2,
    Digit3: KeyboardButtons.DIGIT_3,
    Digit4: KeyboardButtons.DIGIT_4,
    Digit5: KeyboardButtons.DIGIT_5,
    Digit6: KeyboardButtons.DIGIT_6,
    Digit7: KeyboardButtons.DIGIT_7,
    Digit8: KeyboardButtons.DIGIT_8,
    Digit9: KeyboardButtons.DIGIT_9,
    KeyA: KeyboardButtons.KEY_A,
    KeyB: KeyboardButtons.KEY_B,
    KeyC: KeyboardButtons.KEY_C,
    KeyD: KeyboardButtons.KEY_D,
    KeyE: KeyboardButtons.KEY_E,
    KeyF: KeyboardButtons.KEY_F,
    KeyG: KeyboardButtons.KEY_G,
    KeyH: KeyboardButtons.KEY_H,
    KeyI: KeyboardButtons.KEY_I,
    KeyJ: KeyboardButtons.KEY_J,
    KeyK: KeyboardButtons.KEY_K,
    KeyL: KeyboardButtons.KEY_L,
    KeyM: KeyboardButtons.KEY_M,
    KeyN: KeyboardButtons.KEY_N,
    KeyO: KeyboardButtons.KEY_O,
    KeyP: KeyboardButtons.KEY_P,
    KeyQ: KeyboardButtons.KEY_Q,
    KeyR: KeyboardButtons.KEY_R,
    KeyS: KeyboardButtons.KEY_S,
    KeyT: KeyboardButtons.KEY_T,
    KeyU: KeyboardButtons.KEY_U,
    KeyV: KeyboardButtons.KEY_V,
    KeyW: KeyboardButtons.KEY_W,
    KeyX: KeyboardButtons.KEY_X,
    KeyY: KeyboardButtons.KEY_Y,
    KeyZ: KeyboardButtons.KEY_Z,
    ShiftLeft: KeyboardButtons.SHIFT_LEFT,
    Space: KeyboardButtons.SPACE,
};

export function startInputSystem(world: World): void {
    const { keyboardEventHandler, mouseEventHandler } = world.readData<InputInitData>("input-init-data");

    // Gather event data to avoid new input events triggering in the middle of schedules
    const keyboardButtonEvents: InputKeyboardButtonEvent[] = [];
    const mouseButtonEvents: InputMouseButtonEvent[] = [];
    const mouseMotionEvents: InputMouseMotionEvent[] = [];
    const mouseWheelEvents: InputMouseWheelEvent[] = [];

    if (keyboardEventHandler !== undefined) {
        const keyboardButtonDownFn = (ev: KeyboardEvent): void => {
            keyboardButtonEvents.push({
                eventId: "input-keyboard-button-event",
                type: "keydown",
                code: ev.code,
                isComposing: ev.isComposing,
                key: ev.key,
                location: ev.location,
                repeat: ev.repeat,
            });
        };

        keyboardEventHandler.addEventListener("keydown", keyboardButtonDownFn);

        const keyboardButtonUpFn = (ev: KeyboardEvent): void => {
            keyboardButtonEvents.push({
                eventId: "input-keyboard-button-event",
                type: "keyup",
                code: ev.code,
                isComposing: ev.isComposing,
                key: ev.key,
                location: ev.location,
                repeat: ev.repeat,
            });
        };

        keyboardEventHandler.addEventListener("keyup", keyboardButtonUpFn);
    }

    if (mouseEventHandler !== undefined) {
        const mouseButtonFn = (ev: MouseEvent): void => {
            mouseButtonEvents.push({
                eventId: "input-mouse-button-event",
                type: ev.type as "mousedown" | "mouseup",
                button: ev.button,
            });
        };

        mouseEventHandler.addEventListener("mousedown", mouseButtonFn);
        mouseEventHandler.addEventListener("mouseup", mouseButtonFn);

        const mouseMotionFn = (ev: MouseEvent): void => {
            mouseMotionEvents.push({
                eventId: "input-mouse-motion-event",
                type: ev.type as "mouseenter" | "mouseleave" | "mousemove" | "mouseout" | "mouseover",
                clientX: ev.clientX,
                clientY: ev.clientY,
                movementX: ev.movementX,
                movementY: ev.movementY,
                offsetX: ev.offsetX,
                offsetY: ev.offsetY,
                pageX: ev.pageX,
                pageY: ev.pageY,
                screenX: ev.screenX,
                screenY: ev.screenY,
            });
        };

        mouseEventHandler.addEventListener("mouseenter", mouseMotionFn);
        mouseEventHandler.addEventListener("mouseleave", mouseMotionFn);
        mouseEventHandler.addEventListener("mousemove", mouseMotionFn);
        mouseEventHandler.addEventListener("mouseout", mouseMotionFn);
        mouseEventHandler.addEventListener("mouseover", mouseMotionFn);

        const mouseWheelFn = (ev: WheelEvent): void => {
            mouseWheelEvents.push({
                eventId: "input-mouse-wheel-event",
                type: "wheel",
                deltaX: ev.deltaX,
                deltaY: ev.deltaY,
                deltaZ: ev.deltaZ,
                deltaMode: ev.deltaMode,
            });
        };

        mouseEventHandler.addEventListener("wheel", mouseWheelFn);
    }

    world.writeData<InputCaptureData>({
        dataId: "input-capture-data",
        keyboardButtonEvents,
        mouseButtonEvents,
        mouseMotionEvents,
        mouseWheelEvents,
    });

    const keyboardPlugin = new KeyboardPlugin();
    keyboardPlugin.initialize();
    world.setPlugin<KeyboardPlugin>(keyboardPlugin);

    const mousePlugin = new MousePlugin();
    mousePlugin.initialize();
    world.setPlugin<MousePlugin>(mousePlugin);
}

export function updateInputSystem(world: World): void {
    const captureData = world.readData<InputCaptureData>("input-capture-data");

    // Write events
    world.writeEvents(captureData.keyboardButtonEvents);
    world.writeEvents(captureData.mouseButtonEvents);
    world.writeEvents(captureData.mouseMotionEvents);
    world.writeEvents(captureData.mouseWheelEvents);

    // Reset event capture data
    captureData.keyboardButtonEvents.length = 0;
    captureData.mouseButtonEvents.length = 0;
    captureData.mouseMotionEvents.length = 0;
    captureData.mouseWheelEvents.length = 0;

    // Update keyboard plugin
    const keyboardPlugin = world.getPlugin<KeyboardPlugin>("keyboard");
    const keyboardButtonEvents = world.readEvents<InputKeyboardButtonEvent>("input-keyboard-button-event").toArray();
    keyboardPlugin.clear();
    keyboardPlugin.applyEvents(keyboardButtonEvents);

    // Update mouse plugin
    const mousePlugin = world.getPlugin<MousePlugin>("mouse");
    const mouseButtonEvents = world.readEvents<InputMouseButtonEvent>("input-mouse-button-event").toArray();
    const mouseMotionEvents = world.readEvents<InputMouseMotionEvent>("input-mouse-motion-event").toArray();
    const mouseWheelEvents = world.readEvents<InputMouseWheelEvent>("input-mouse-wheel-event").toArray();
    mousePlugin.clear();
    mousePlugin.applyEvents(mouseButtonEvents, mouseMotionEvents, mouseWheelEvents);
}

export class KeyboardPlugin implements WorldPlugin {
    private states: Map<KeyboardButtons, CodeState>;

    public readonly pluginId = "keyboard";

    public constructor() {
        this.states = new Map();
    }

    public applyEvents(buttonEvents: InputKeyboardButtonEvent[]): void {
        for (const ev of buttonEvents) {
            const code = KEYBOARD_BUTTONS_LOOKUP[ev.code] as KeyboardButtons | undefined;

            if (code === undefined) {
                continue;
            }

            switch (ev.type) {
                case "keydown": {
                    this.press(code);
                    break;
                }
                case "keyup": {
                    this.release(code);
                    break;
                }
                default: {
                    assertUnreachable(ev.type);
                }
            }
        }
    }

    public clear(): void {
        for (const value of this.states.values()) {
            if (value.state === ButtonState.Released) {
                value.state = ButtonState.None;
            } else if (value.state === ButtonState.Pressed) {
                value.state = ButtonState.Pressing;
            }
        }
    }

    public initialize(): void {
        for (const key in KEYBOARD_BUTTONS_LOOKUP) {
            this.states.set(KEYBOARD_BUTTONS_LOOKUP[key], { code: key, state: ButtonState.None });
        }
    }

    public isPressed(button: KeyboardButtons): boolean {
        const key = this.states.get(button);
        return key !== undefined ? key.state === ButtonState.Pressed : false;
    }

    public isPressing(button: KeyboardButtons): boolean {
        const key = this.states.get(button);
        return key !== undefined ? key.state === ButtonState.Pressed || key.state === ButtonState.Pressing : false;
    }

    public isReleased(button: KeyboardButtons): boolean {
        const key = this.states.get(button);
        return key !== undefined ? key.state === ButtonState.Released : false;
    }

    public press(button: KeyboardButtons): void {
        const key = this.states.get(button);

        if (key === undefined) {
            return;
        }

        if (key.state === ButtonState.None || key.state === ButtonState.Released) {
            key.state = ButtonState.Pressed;
        }
    }

    public release(button: KeyboardButtons): void {
        const key = this.states.get(button);

        if (key === undefined) {
            return;
        }

        key.state = ButtonState.Released;
    }
}

export class MousePlugin implements WorldPlugin {
    private cursorPosition: InputMouseCursorPosition;
    private states: Map<MouseButtons, CodeState>;

    public readonly pluginId = "mouse";

    public constructor() {
        this.cursorPosition = { x: -1, y: -1 };

        this.states = new Map();
    }

    public applyEvents(
        buttonEvents: InputMouseButtonEvent[],
        motionEvents: InputMouseMotionEvent[],
        _wheelEvents: InputMouseWheelEvent[],
    ): void {
        for (const ev of buttonEvents) {
            const code = MOUSE_BUTTONS_LOOKUP[ev.button] as MouseButtons | undefined;

            if (code === undefined) {
                continue;
            }

            switch (ev.type) {
                case "mousedown": {
                    this.press(code);
                    break;
                }
                case "mouseup": {
                    this.release(code);
                    break;
                }
            }
        }

        for (const ev of motionEvents) {
            this.moveCursorTo({ x: ev.offsetX, y: ev.offsetY });
        }
    }

    public clear(): void {
        for (const value of this.states.values()) {
            if (value.state === ButtonState.Released) {
                value.state = ButtonState.None;
            } else if (value.state === ButtonState.Pressed) {
                value.state = ButtonState.Pressing;
            }
        }
    }

    public getCursorPosition(): InputMouseCursorPosition {
        return this.cursorPosition;
    }

    public initialize(): void {
        for (const key in MOUSE_BUTTONS_LOOKUP) {
            this.states.set(MOUSE_BUTTONS_LOOKUP[key], { code: key, state: ButtonState.None });
        }
    }

    public isPressed(button: MouseButtons): boolean {
        const key = this.states.get(button);
        return key !== undefined ? key.state === ButtonState.Pressed : false;
    }

    public isPressing(button: MouseButtons): boolean {
        const key = this.states.get(button);
        return key !== undefined ? key.state === ButtonState.Pressed || key.state === ButtonState.Pressing : false;
    }

    public isReleased(button: MouseButtons): boolean {
        const key = this.states.get(button);
        return key !== undefined ? key.state === ButtonState.Released : false;
    }

    public moveCursorTo(position: InputMouseCursorPosition): void {
        this.cursorPosition = position;
    }

    public press(button: MouseButtons): void {
        const key = this.states.get(button);

        if (key === undefined) {
            return;
        }

        if (key.state === ButtonState.None || key.state === ButtonState.Released) {
            key.state = ButtonState.Pressed;
        }
    }

    public release(button: MouseButtons): void {
        const key = this.states.get(button);

        if (key === undefined) {
            return;
        }

        key.state = ButtonState.Released;
    }
}

export class InputModule implements WorldModule {
    public readonly moduleId = "input-module";

    public setup(world: World): void {
        world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: startInputSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: updateInputSystem });
    }
}

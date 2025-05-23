import { assertUnreachable } from "redgeometry/src/utility/debug";
import type { DefaultSystemStage, WorldId, WorldModule, WorldPlugin } from "../ecs/types.js";
import type { World } from "../ecs/world.js";

export type InputInitData = {
    dataId: "input-init";
    keyboardEventHandler: GlobalEventHandlers | undefined;
    mouseEventHandler: GlobalEventHandlers | undefined;
    receiverIds: WorldId[];
};

type InputCaptureData = {
    dataId: "input-capture";
    keyboardButtonEvents: InputKeyboardButtonEvent[];
    mouseButtonEvents: InputMouseButtonEvent[];
    mouseMotionEvents: InputMouseMotionEvent[];
    mouseWheelEvents: InputMouseWheelEvent[];
};

export type InputKeyboardButtonEvent = {
    eventId: "input-keyboard-button";
    type: "keyup" | "keydown";
    code: string;
    isComposing: boolean;
    key: string;
    location: number;
    repeat: boolean;
};

export type InputMouseMotionEvent = {
    eventId: "input-mouse-motion";
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
    eventId: "input-mouse-button";
    type: "mousedown" | "mouseup";
    button: number;
};

export type InputMouseWheelEvent = {
    eventId: "input-mouse-wheel";
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
    Digit1: 0,
    Digit2: 1,
    Digit3: 2,
    Digit4: 3,
    Digit5: 4,
    Digit6: 5,
    Digit7: 6,
    Digit8: 7,
    Digit9: 8,
    KeyA: 9,
    KeyB: 10,
    KeyC: 11,
    KeyD: 12,
    KeyE: 13,
    KeyF: 14,
    KeyG: 15,
    KeyH: 16,
    KeyI: 17,
    KeyJ: 18,
    KeyK: 19,
    KeyL: 20,
    KeyM: 21,
    KeyN: 22,
    KeyO: 23,
    KeyP: 24,
    KeyQ: 25,
    KeyR: 26,
    KeyS: 27,
    KeyT: 28,
    KeyU: 29,
    KeyV: 30,
    KeyW: 31,
    KeyX: 32,
    KeyY: 33,
    KeyZ: 34,
    ShiftLeft: 35,
    Space: 36,
} as const;
export type KeyboardButtons = (typeof KeyboardButtons)[keyof typeof KeyboardButtons];

export const MouseButtons = {
    Mouse1: 0,
    Mouse2: 1,
    Mouse3: 2,
    Mouse4: 3,
    Mouse5: 4,
} as const;
export type MouseButtons = (typeof MouseButtons)[keyof typeof MouseButtons];

const ButtonState = {
    None: 0,
    Pressed: 1,
    Pressing: 2,
    Released: 3,
} as const;
type ButtonState = (typeof ButtonState)[keyof typeof ButtonState];

const MOUSE_BUTTONS_LOOKUP: Record<number, MouseButtons> = {
    0: MouseButtons.Mouse1,
    1: MouseButtons.Mouse3,
    2: MouseButtons.Mouse2,
    3: MouseButtons.Mouse4,
    4: MouseButtons.Mouse5,
};

const KEYBOARD_BUTTONS_LOOKUP: Record<string, KeyboardButtons> = {
    Digit1: KeyboardButtons.Digit1,
    Digit2: KeyboardButtons.Digit2,
    Digit3: KeyboardButtons.Digit3,
    Digit4: KeyboardButtons.Digit4,
    Digit5: KeyboardButtons.Digit5,
    Digit6: KeyboardButtons.Digit6,
    Digit7: KeyboardButtons.Digit7,
    Digit8: KeyboardButtons.Digit8,
    Digit9: KeyboardButtons.Digit9,
    KeyA: KeyboardButtons.KeyA,
    KeyB: KeyboardButtons.KeyB,
    KeyC: KeyboardButtons.KeyC,
    KeyD: KeyboardButtons.KeyD,
    KeyE: KeyboardButtons.KeyE,
    KeyF: KeyboardButtons.KeyF,
    KeyG: KeyboardButtons.KeyG,
    KeyH: KeyboardButtons.KeyH,
    KeyI: KeyboardButtons.KeyI,
    KeyJ: KeyboardButtons.KeyJ,
    KeyK: KeyboardButtons.KeyK,
    KeyL: KeyboardButtons.KeyL,
    KeyM: KeyboardButtons.KeyM,
    KeyN: KeyboardButtons.KeyN,
    KeyO: KeyboardButtons.KeyO,
    KeyP: KeyboardButtons.KeyP,
    KeyQ: KeyboardButtons.KeyQ,
    KeyR: KeyboardButtons.KeyR,
    KeyS: KeyboardButtons.KeyS,
    KeyT: KeyboardButtons.KeyT,
    KeyU: KeyboardButtons.KeyU,
    KeyV: KeyboardButtons.KeyV,
    KeyW: KeyboardButtons.KeyW,
    KeyX: KeyboardButtons.KeyX,
    KeyY: KeyboardButtons.KeyY,
    KeyZ: KeyboardButtons.KeyZ,
    ShiftLeft: KeyboardButtons.ShiftLeft,
    Space: KeyboardButtons.Space,
};

export function startInputSystem(world: World): void {
    const { keyboardEventHandler, mouseEventHandler } = world.readData<InputInitData>("input-init");

    // Gather event data to avoid new input events triggering in the middle of schedules
    const keyboardButtonEvents: InputKeyboardButtonEvent[] = [];
    const mouseButtonEvents: InputMouseButtonEvent[] = [];
    const mouseMotionEvents: InputMouseMotionEvent[] = [];
    const mouseWheelEvents: InputMouseWheelEvent[] = [];

    if (keyboardEventHandler !== undefined) {
        const keyboardButtonDownFn = (ev: KeyboardEvent): void => {
            keyboardButtonEvents.push({
                eventId: "input-keyboard-button",
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
                eventId: "input-keyboard-button",
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
                eventId: "input-mouse-button",
                type: ev.type as "mousedown" | "mouseup",
                button: ev.button,
            });
        };

        mouseEventHandler.addEventListener("mousedown", mouseButtonFn);
        mouseEventHandler.addEventListener("mouseup", mouseButtonFn);

        const mouseMotionFn = (ev: MouseEvent): void => {
            mouseMotionEvents.push({
                eventId: "input-mouse-motion",
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
                eventId: "input-mouse-wheel",
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
        dataId: "input-capture",
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
    const initData = world.readData<InputInitData>("input-init");
    const captureData = world.readData<InputCaptureData>("input-capture");

    // Write events
    world.writeEvents(captureData.keyboardButtonEvents);
    world.writeEvents(captureData.mouseButtonEvents);
    world.writeEvents(captureData.mouseMotionEvents);
    world.writeEvents(captureData.mouseWheelEvents);

    // Propagate events
    for (const id of initData.receiverIds) {
        const channel = world.getChannel(id);
        channel.queueEvents(captureData.keyboardButtonEvents);
        channel.queueEvents(captureData.mouseButtonEvents);
        channel.queueEvents(captureData.mouseMotionEvents);
        channel.queueEvents(captureData.mouseWheelEvents);
    }

    // Reset event capture data
    captureData.keyboardButtonEvents.length = 0;
    captureData.mouseButtonEvents.length = 0;
    captureData.mouseMotionEvents.length = 0;
    captureData.mouseWheelEvents.length = 0;

    // Update keyboard plugin
    const keyboardPlugin = world.getPlugin<KeyboardPlugin>("keyboard");
    const keyboardButtonEvents = world.readEvents<InputKeyboardButtonEvent>("input-keyboard-button");
    keyboardPlugin.clear();
    keyboardPlugin.applyEvents(keyboardButtonEvents);

    // Update mouse plugin
    const mousePlugin = world.getPlugin<MousePlugin>("mouse");
    const mouseButtonEvents = world.readEvents<InputMouseButtonEvent>("input-mouse-button");
    const mouseMotionEvents = world.readEvents<InputMouseMotionEvent>("input-mouse-motion");
    const mouseWheelEvents = world.readEvents<InputMouseWheelEvent>("input-mouse-wheel");
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
    public readonly moduleId = "input-receiver";

    public setup(world: World): void {
        world.registerPlugin<MousePlugin>("mouse");
        world.registerPlugin<KeyboardPlugin>("keyboard");

        world.registerData<InputCaptureData>("input-capture");
        world.registerData<InputInitData>("input-init");

        world.registerEvent<InputKeyboardButtonEvent>("input-keyboard-button");
        world.registerEvent<InputMouseMotionEvent>("input-mouse-motion");
        world.registerEvent<InputMouseButtonEvent>("input-mouse-button");
        world.registerEvent<InputMouseWheelEvent>("input-mouse-wheel");

        world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: startInputSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: updateInputSystem });
    }
}

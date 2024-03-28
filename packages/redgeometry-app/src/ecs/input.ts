import type { DefaultSystemStage, WorldId, WorldModule, WorldPlugin } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import { assertUnreachable } from "redgeometry/src/utility/debug";

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

export enum KeyboardButtons {
    KeyW,
    KeyA,
    KeyS,
    KeyD,
    Space,
    KeyC,
    ShiftLeft,
}

export enum MouseButtons {
    Mouse1,
    Mouse2,
    Mouse3,
    Mouse4,
    Mouse5,
}

enum ButtonState {
    None,
    Pressed,
    Pressing,
    Released,
}

const MOUSE_BUTTONS_LOOKUP: Record<number, MouseButtons> = {
    0: MouseButtons.Mouse1,
    1: MouseButtons.Mouse3,
    2: MouseButtons.Mouse2,
    3: MouseButtons.Mouse4,
    4: MouseButtons.Mouse5,
};

const KEYBOARD_BUTTONS_LOOKUP: Record<string, KeyboardButtons> = {
    KeyW: KeyboardButtons.KeyW,
    KeyA: KeyboardButtons.KeyA,
    KeyS: KeyboardButtons.KeyS,
    KeyD: KeyboardButtons.KeyD,
    Space: KeyboardButtons.Space,
    KeyC: KeyboardButtons.KeyC,
    ShiftLeft: KeyboardButtons.ShiftLeft,
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
    const optionsData = world.readData<InputInitData>("input-init");
    const captureData = world.readData<InputCaptureData>("input-capture");

    // Propagate events to a receiver
    for (const id of optionsData.receiverIds) {
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

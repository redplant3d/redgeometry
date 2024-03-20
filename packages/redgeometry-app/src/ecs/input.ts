import type { DefaultSystemStage, WorldId } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import { assertUnreachable } from "redgeometry/src/utility/debug";

export type InputSenderData = {
    dataId: "inputSender";
    keyboardEventHandler: GlobalEventHandlers;
    mouseEventHandler: GlobalEventHandlers;
    receiverId: WorldId;
};

export type InputData = {
    dataId: "input";
    keyboard: KeyboardInput;
    mouse: MouseInput;
};

export type InputEventsData = {
    dataId: "inputEvents";
    keyboardEvents: InputKeyboardEventType[];
    mouseEvents: InputMouseEventType[];
};

export type InputDataEvent = {
    eventId: "inputData";
    keyboardEvents: InputKeyboardEventType[];
    mouseEvents: InputMouseEventType[];
};

export type InputMouseEventType = {
    type: string;
    button: number;
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
    x: number;
    y: number;
};

export type InputKeyboardEventType = {
    type: "keydown" | "keyup";
    code: string;
    isComposing: boolean;
    key: string;
    location: number;
    repeat: boolean;
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

export function inputSenderPlugin(world: World): void {
    world.registerData<InputEventsData>("inputEvents");
    world.registerData<InputSenderData>("inputSender");

    world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: startInputSenderSystem });

    world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: updateInputSenderSystem });
}

export function inputReceiverPlugin(world: World): void {
    world.registerEvent<InputDataEvent>("inputData");
    world.registerData<InputData>("input");

    world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: startInputReceiverSystem });

    world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: updateInputReceiverSystem });
}

export function startInputSenderSystem(world: World): void {
    const { keyboardEventHandler, mouseEventHandler } = world.readData<InputSenderData>("inputSender");

    const keyboardEvents: InputKeyboardEventType[] = [];
    const mouseEvents: InputMouseEventType[] = [];

    const keyDownFn = (ev: KeyboardEvent): void => {
        keyboardEvents.push({
            type: "keydown",
            code: ev.code,
            isComposing: ev.isComposing,
            key: ev.key,
            location: ev.location,
            repeat: ev.repeat,
        });
    };

    keyboardEventHandler.addEventListener("keydown", keyDownFn);

    const keyUpFn = (ev: KeyboardEvent): void => {
        keyboardEvents.push({
            type: "keyup",
            code: ev.code,
            isComposing: ev.isComposing,
            key: ev.key,
            location: ev.location,
            repeat: ev.repeat,
        });
    };

    keyboardEventHandler.addEventListener("keyup", keyUpFn);

    const mouseFn = (ev: MouseEvent): void => {
        mouseEvents.push({
            type: ev.type,
            button: ev.button,
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
            x: ev.x,
            y: ev.y,
        });
    };

    mouseEventHandler.addEventListener("mousedown", mouseFn);
    mouseEventHandler.addEventListener("mouseenter", mouseFn);
    mouseEventHandler.addEventListener("mouseleave", mouseFn);
    mouseEventHandler.addEventListener("mousemove", mouseFn);
    mouseEventHandler.addEventListener("mouseout", mouseFn);
    mouseEventHandler.addEventListener("mouseover", mouseFn);
    mouseEventHandler.addEventListener("mouseup", mouseFn);

    world.writeData<InputEventsData>({
        dataId: "inputEvents",
        keyboardEvents,
        mouseEvents,
    });
}

export function updateInputSenderSystem(world: World): void {
    const { receiverId } = world.readData<InputSenderData>("inputSender");
    const channel = world.getChannel(receiverId);

    const { keyboardEvents, mouseEvents } = world.readData<InputEventsData>("inputEvents");
    channel.queueEvent<InputDataEvent>({
        eventId: "inputData",
        keyboardEvents: [...keyboardEvents],
        mouseEvents: [...mouseEvents],
    });

    mouseEvents.length = 0;
    keyboardEvents.length = 0;
}

export function startInputReceiverSystem(world: World): void {
    world.writeData<InputData>({
        dataId: "input",
        keyboard: new KeyboardInput(),
        mouse: new MouseInput(),
    });
}

export function updateInputReceiverSystem(world: World): void {
    const events = world.readEvents<InputDataEvent>("inputData");
    const data = world.readData<InputData>("input");

    data.keyboard.clear();
    data.mouse.clear();

    for (const ev of events) {
        data.keyboard.applyEvents(ev.keyboardEvents);
        data.mouse.applyEvents(ev.mouseEvents);
    }
}

export class KeyboardInput {
    private states: Map<KeyboardButtons, { code: string; state: ButtonState }>;

    public events: InputKeyboardEventType[];

    public constructor() {
        this.states = new Map();
        this.events = [];

        this.initialize();
    }

    public applyEvents(keyboardEvents: InputKeyboardEventType[]): void {
        this.events = keyboardEvents;

        for (const ev of keyboardEvents) {
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

export class MouseInput {
    private states: Map<MouseButtons, { code: string; state: ButtonState }>;

    public events: InputMouseEventType[];

    public constructor() {
        this.states = new Map();
        this.events = [];

        this.initialize();
    }

    public applyEvents(mouseEvents: InputMouseEventType[]): void {
        this.events = mouseEvents;

        for (const ev of mouseEvents) {
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

import type { WorldId } from "../ecs/types.js";
import { World } from "../ecs/world.js";

export interface InputSenderData {
    dataId: "inputSender";
    receiverId: WorldId;
}

export interface InputData {
    dataId: "input";
    input: Input;
}

export interface InputEventsData {
    dataId: "inputEvents";
    keyboardEvents: InputKeyboardEventType[];
    mouseEvents: InputMouseEventType[];
}

export interface InputDataEvent {
    eventId: "inputData";
    keyboardEvents: InputKeyboardEventType[];
    mouseEvents: InputMouseEventType[];
}

export type InputMouseEventType = {
    type: string;
    altKey: boolean;
    button: number;
    buttons: number;
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    metaKey: boolean;
    movementX: number;
    movementY: number;
    offsetX: number;
    offsetY: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
    shiftKey: boolean;
    x: number;
    y: number;
};

export type InputKeyboardEventType = {
    altKey: boolean;
    code: string;
    ctrlKey: boolean;
    isComposing: boolean;
    key: string;
    location: number;
    metaKey: boolean;
    repeat: boolean;
    shiftKey: boolean;
};

export function inputSenderPlugin(world: World): void {
    world.registerData<InputEventsData>("inputEvents");
    world.registerData<InputSenderData>("inputSender");

    world.addSystem({ fn: startInputSenderSystem, stage: "start" });
    world.addSystem({ fn: updateInputSenderSystem });
}

export function inputReceiverPlugin(world: World): void {
    world.registerEvent<InputDataEvent>("inputData");
    world.registerData<InputData>("input");

    world.addSystem({ fn: startInputReceiverSystem, stage: "start" });
    world.addSystem({ fn: updateInputReceiverSystem });
}

export function startInputSenderSystem(world: World): void {
    const keyboardEvents: InputKeyboardEventType[] = [];
    const mouseEvents: InputMouseEventType[] = [];

    const keyboardFn = (ev: KeyboardEvent): void => {
        keyboardEvents.push({
            altKey: ev.altKey,
            code: ev.code,
            ctrlKey: ev.ctrlKey,
            isComposing: ev.isComposing,
            key: ev.key,
            location: ev.location,
            metaKey: ev.metaKey,
            repeat: ev.repeat,
            shiftKey: ev.shiftKey,
        });
    };

    self.addEventListener("keydown", keyboardFn);
    self.addEventListener("keyup", keyboardFn);

    const mouseFn = (ev: MouseEvent): void => {
        mouseEvents.push({
            type: ev.type,
            altKey: ev.altKey,
            button: ev.button,
            buttons: ev.buttons,
            clientX: ev.clientX,
            clientY: ev.clientY,
            ctrlKey: ev.ctrlKey,
            metaKey: ev.metaKey,
            movementX: ev.movementX,
            movementY: ev.movementY,
            offsetX: ev.offsetX,
            offsetY: ev.offsetY,
            pageX: ev.pageX,
            pageY: ev.pageY,
            screenX: ev.screenX,
            screenY: ev.screenY,
            shiftKey: ev.shiftKey,
            x: ev.x,
            y: ev.y,
        });
    };

    self.addEventListener("mousedown", mouseFn);
    self.addEventListener("mouseenter", mouseFn);
    self.addEventListener("mouseleave", mouseFn);
    self.addEventListener("mousemove", mouseFn);
    self.addEventListener("mouseout", mouseFn);
    self.addEventListener("mouseover", mouseFn);
    self.addEventListener("mouseup", mouseFn);

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
    channel.queueEvent<InputDataEvent>({ eventId: "inputData", keyboardEvents, mouseEvents });

    mouseEvents.length = 0;
    keyboardEvents.length = 0;
}

export function startInputReceiverSystem(world: World): void {
    world.writeData<InputData>({
        dataId: "input",
        input: new Input(),
    });
}

export function updateInputReceiverSystem(world: World): void {
    const events = world.readEvents<InputDataEvent>("inputData");
    const data = world.readData<InputData>("input");

    for (const ev of events) {
        data.input.applyEvents(ev.keyboardEvents, ev.mouseEvents);
    }
}

export class Input {
    public keyboardEvents: InputKeyboardEventType[];
    public mouseEvents: InputMouseEventType[];

    constructor() {
        this.keyboardEvents = [];
        this.mouseEvents = [];
    }

    public applyEvents(keyboardEvents: InputKeyboardEventType[], mouseEvents: InputMouseEventType[]): void {
        this.keyboardEvents = keyboardEvents;
        this.mouseEvents = mouseEvents;
    }
}

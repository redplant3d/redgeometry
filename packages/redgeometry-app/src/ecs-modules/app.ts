import type { World, WorldContext } from "../ecs/world.ts";
import { createRandomSeed } from "../utility/helper.ts";
import {
    ButtonInputElement,
    ComboBoxInputElement,
    createElement,
    TextBoxInputElement,
    type AppInputElement,
} from "../utility/html-element.ts";
import { APP_CONTEXT_MODULE_ID, APP_CONTEXT_START_SYSTEM_ID, appContextModule } from "./app-context.ts";
import { APP_INPUT_MODULE_ID, appInputModule } from "./app-input.ts";
import {
    INPUT_MODULE_ID,
    INPUT_START_SYSTEM_ID,
    INPUT_UPDATE_SYSTEM_ID,
    inputModule,
    type InputInitData,
} from "./input.ts";
import { TIME_MODULE_ID, TIME_START_SYSTEM_ID, TIME_UPDATE_SYSTEM_ID, timeModule } from "./time.ts";

export const START_SCHEDULE_ID = "start-schedule";
export const UPDATE_SCHEDULE_ID = "update-schedule";
export const STOP_SCHEDULE_ID = "stop-schedule";

export type AppLauncherData = {
    dataId: "app-launcher-data";
    appPartId: string;
    appPartIds: string[];
    requestExit: boolean;
};

export type AppMainData = {
    dataId: "app-main-data";
    canvas: HTMLCanvasElement;
    canvasContainer: HTMLElement;
    urlSearchParams: URLSearchParams;
};

export type AppMainInputData = {
    dataId: "app-main-input-data";
    appComboBox: ComboBoxInputElement;
    randomizeButton: ButtonInputElement;
    seedTextBox: TextBoxInputElement;
    generatorTextBox: TextBoxInputElement;
    updateButton: ButtonInputElement;
};

export type AppInputData = {
    dataId: "app-input-data";
    inputElements: AppInputElement[];
    paramsContainer: HTMLElement;
};

export type AppCanvasData = {
    dataId: "app-canvas-data";
    canvas: HTMLCanvasElement;
};

export type AppCommandEvent = {
    eventId: "app-command-event";
    command: "randomize" | "update";
};

export type WindowResizeEvent = {
    eventId: "window-resize-event";
    width: number;
    height: number;
};

export const APP_PRE_START_SYSTEM_ID = "app-pre-start-system";
export const APP_START_SYSTEM_ID = "app-start-system";
export const APP_UPDATE_SYSTEM_ID = "app-update-system";

function appMainPreStartSystem(world: World): void {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const parent = document.body;

    // Container
    const paramsContainer = createElement("div", {
        id: "params",
        style: "height: 30px",
    });
    const canvasContainer = createElement("div", {
        id: "canvasContainer",
        style: "border: 1px solid black; position:absolute; top:40px; right:10px; bottom:10px; left:10px;",
    });

    parent.appendChild(paramsContainer);
    parent.appendChild(canvasContainer);

    const canvas = createElement("canvas", { id: "canvas2D" });

    world.setData<AppCanvasData>({
        dataId: "app-canvas-data",
        canvas,
    });

    canvasContainer.appendChild(canvas);

    world.setData<AppMainData>({
        dataId: "app-main-data",
        canvas,
        canvasContainer,
        urlSearchParams,
    });

    world.setData<AppInputData>({
        dataId: "app-input-data",
        paramsContainer,
        inputElements: [],
    });

    world.addEvent<WindowResizeEvent>({
        eventId: "window-resize-event",
        width: canvasContainer.clientWidth,
        height: canvasContainer.clientHeight,
    });

    window.addEventListener("resize", () => {
        const { canvasContainer } = world.getData<AppMainData>("app-main-data");

        world.addEvent<WindowResizeEvent>({
            eventId: "window-resize-event",
            width: canvasContainer.clientWidth,
            height: canvasContainer.clientHeight,
        });
    });

    world.setData<InputInitData>({
        dataId: "input-init-data",
        keyboardEventHandler: self,
        mouseEventHandler: canvas,
    });
}

function appMainStartSystem(world: World): void {
    const seed = createRandomSeed();

    const { inputElements } = world.getData<AppInputData>("app-input-data");
    const { appPartIds, appPartId } = world.getData<AppLauncherData>("app-launcher-data");

    const inputAppComboBox = new ComboBoxInputElement("app-main-data", appPartId);
    inputAppComboBox.setOptionValues(...appPartIds);
    inputAppComboBox.addEventListener("input", () => {
        window.location.replace("?app=" + inputAppComboBox.getValue());
    });
    inputElements.push(inputAppComboBox);

    const randomizeButton = new ButtonInputElement("randomize", "randomize");
    randomizeButton.addEventListener("click", () => {
        world.addEvent<AppCommandEvent>({ eventId: "app-command-event", command: "randomize" });
    });
    inputElements.push(randomizeButton);

    const seedTextBox = new TextBoxInputElement("seed", seed.toString());
    seedTextBox.setStyle("width: 80px");
    inputElements.push(seedTextBox);

    const generatorTextBox = new TextBoxInputElement("generator", "0");
    generatorTextBox.setStyle("width: 25px");
    inputElements.push(generatorTextBox);

    const updateButton = new ButtonInputElement("update", "update");
    updateButton.addEventListener("click", () => {
        world.addEvent<AppCommandEvent>({ eventId: "app-command-event", command: "update" });
    });
    inputElements.push(updateButton);

    world.setData<AppMainInputData>({
        dataId: "app-main-input-data",
        appComboBox: inputAppComboBox,
        randomizeButton,
        seedTextBox,
        generatorTextBox,
        updateButton,
    });
}

function appUpdateSystem(world: World): void {
    const windowResizeEvent = world.findLastEvent<WindowResizeEvent>("window-resize-event");

    if (windowResizeEvent !== undefined) {
        const { canvas } = world.getData<AppCanvasData>("app-canvas-data");

        canvas.width = windowResizeEvent.width;
        canvas.height = windowResizeEvent.height;
    }
}

export const APP_MODULE_ID = "app-module";

export function appModule(context: WorldContext): void {
    context.addModule({
        id: TIME_MODULE_ID,
        fn: timeModule,
    });
    context.addModule({
        id: INPUT_MODULE_ID,
        fn: inputModule,
    });
    context.addModule({
        id: APP_INPUT_MODULE_ID,
        fn: appInputModule,
    });
    context.addModule({
        id: APP_CONTEXT_MODULE_ID,
        fn: appContextModule,
    });

    context.addData<AppLauncherData>("app-launcher-data");
    context.addData<AppMainData>("app-main-data");
    context.addData<AppMainInputData>("app-main-input-data");
    context.addData<AppInputData>("app-input-data");
    context.addData<AppCanvasData>("app-canvas-data");

    context.addEvent<WindowResizeEvent>("window-resize-event");
    context.addEvent<AppCommandEvent>("app-command-event");

    context.addSchedule(START_SCHEDULE_ID);
    context.addSchedule(UPDATE_SCHEDULE_ID);
    context.addSchedule(STOP_SCHEDULE_ID);

    context.addSystem({
        id: APP_PRE_START_SYSTEM_ID,
        fn: appMainPreStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: APP_START_SYSTEM_ID,
        fn: appMainStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: APP_UPDATE_SYSTEM_ID,
        fn: appUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        scheduleId: START_SCHEDULE_ID,
        seq: [
            APP_PRE_START_SYSTEM_ID,
            APP_CONTEXT_START_SYSTEM_ID,
            INPUT_START_SYSTEM_ID,
            TIME_START_SYSTEM_ID,
            APP_START_SYSTEM_ID,
        ],
    });

    context.addSystemDepedency({
        scheduleId: UPDATE_SCHEDULE_ID,
        seq: [INPUT_UPDATE_SYSTEM_ID, TIME_UPDATE_SYSTEM_ID, APP_UPDATE_SYSTEM_ID],
    });
}

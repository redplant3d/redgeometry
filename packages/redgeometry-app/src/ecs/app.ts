import type { DefaultSystemStage, DefaultWorldScheduleId, WorldModule } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import {
    AppInputModule,
    ButtonInputElement,
    ComboBoxInputElement,
    TextBoxInputElement,
    startInputElementsSystem,
    type AppInputData,
} from "../ecs/app-input.js";
import { createRandomSeed } from "../utility/helper.js";
import type { AppLauncherData } from "./app-launcher.js";
import { InputModule, type InputInitData } from "./input.js";
import { TimeModule, type AnimationFrameEvent, type TimeInitData } from "./time.js";

export type AppMainData = {
    dataId: "app-main";
    canvas: HTMLCanvasElement;
    canvasContainer: HTMLElement;
    urlSearchParams: URLSearchParams;
};

export type AppMainInputData = {
    dataId: "app-main-input";
    appComboBox: ComboBoxInputElement;
    randomizeButton: ButtonInputElement;
    seedTextBox: TextBoxInputElement;
    generatorTextBox: TextBoxInputElement;
    updateButton: ButtonInputElement;
};

export type AppCanvasData = {
    dataId: "app-canvas";
    canvas: HTMLCanvasElement | OffscreenCanvas;
};

export type AppStateData = {
    dataId: "app-state";
    generator: number;
    seed: number;
};

export type AppCommandEvent = {
    eventId: "app-command";
    command: "randomize" | "update";
};

export type WindowResizeEvent = {
    eventId: "window-resize";
    width: number;
    height: number;
};

export function initAppMainPreSystem(world: World): void {
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

    world.writeData<AppCanvasData>({
        dataId: "app-canvas",
        canvas: canvas.transferControlToOffscreen(),
    });

    canvasContainer.appendChild(canvas);

    world.writeData<AppMainData>({
        dataId: "app-main",
        canvas,
        canvasContainer,
        urlSearchParams,
    });

    world.writeData<AppInputData>({
        dataId: "app-input",
        paramsContainer,
        inputElements: [],
    });

    world.writeEvent<WindowResizeEvent>({
        eventId: "window-resize",
        width: canvasContainer.clientWidth,
        height: canvasContainer.clientHeight,
    });

    window.addEventListener("resize", () => {
        const { canvasContainer } = world.readData<AppMainData>("app-main");

        world.queueEvent<WindowResizeEvent>({
            eventId: "window-resize",
            width: canvasContainer.clientWidth,
            height: canvasContainer.clientHeight,
        });
    });

    world.writeData<TimeInitData>({
        dataId: "time-init",
        receiverIds: ["remote"],
    });

    world.writeData<InputInitData>({
        dataId: "input-init",
        keyboardEventHandler: self,
        mouseEventHandler: canvas,
        receiverIds: ["remote"],
    });
}

export function addAppInputsSystem(world: World): void {
    const seed = createRandomSeed();

    const { inputElements } = world.readData<AppInputData>("app-input");
    const { appPartIds, appPartId } = world.readData<AppLauncherData>("app-launcher");

    const inputAppComboBox = new ComboBoxInputElement("app-main", appPartId);
    inputAppComboBox.setOptionValues(...appPartIds);
    inputAppComboBox.addEventListener("input", () => {
        window.location.replace(`?app=${inputAppComboBox.getValue()}`);
    });
    inputElements.push(inputAppComboBox);

    const randomizeButton = new ButtonInputElement("randomize", "randomize");
    randomizeButton.addEventListener("click", () => {
        world.queueEvent<AppCommandEvent>({ eventId: "app-command", command: "randomize" });
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
        world.queueEvent<AppCommandEvent>({ eventId: "app-command", command: "update" });
    });
    inputElements.push(updateButton);

    world.writeData<AppMainInputData>({
        dataId: "app-main-input",
        appComboBox: inputAppComboBox,
        randomizeButton,
        seedTextBox,
        generatorTextBox,
        updateButton,
    });
}

export function writeAppStateSystem(world: World): void {
    const { generatorTextBox, seedTextBox } = world.readData<AppMainInputData>("app-main-input");

    world.writeData<AppStateData>({
        dataId: "app-state",
        seed: seedTextBox.getInt(),
        generator: generatorTextBox.getInt(),
    });
}

export async function initAppMainPostSystem(world: World): Promise<void> {
    const channel = world.getChannel("remote");

    const appStateData = world.readData<AppStateData>("app-state");
    channel.queueData<AppStateData>(appStateData);

    const appCanvasData = world.readData<AppCanvasData>("app-canvas");
    if (appCanvasData.canvas instanceof OffscreenCanvas) {
        channel.queueData<AppCanvasData>(appCanvasData, [appCanvasData.canvas]);
    } else {
        channel.queueData<AppCanvasData>(appCanvasData);
    }

    await channel.runScheduleAsync("start");

    requestAnimationFrame((time) => {
        world.writeEvent<AnimationFrameEvent>({ eventId: "animation-frame", time });
        world.runSchedule<DefaultWorldScheduleId>("update");
    });
}

export async function appMainSystem(world: World): Promise<void> {
    const channel = world.getChannel("remote");

    const windowResizeEvents = world.readEvents<WindowResizeEvent>("window-resize");
    channel.queueEvents(windowResizeEvents);

    const appStateData = world.readData<AppStateData>("app-state");
    channel.queueData(appStateData);

    const appCommandEvents = world.readEvents<AppCommandEvent>("app-command");
    channel.queueEvents(appCommandEvents);

    await channel.runScheduleAsync<DefaultWorldScheduleId>("update");

    requestAnimationFrame((time) => {
        world.writeEvent<AnimationFrameEvent>({ eventId: "animation-frame", time });
        world.runSchedule<DefaultWorldScheduleId>("update");
    });
}

export function initAppRemoteSystem(world: World): void {
    world.writeData<TimeInitData>({
        dataId: "time-init",
        receiverIds: [],
    });

    world.writeData<InputInitData>({
        dataId: "input-init",
        keyboardEventHandler: undefined,
        mouseEventHandler: undefined,
        receiverIds: [],
    });
}

export function resizeCanvasSystem(world: World): void {
    const windowResizeEvent = world.readLatestEvent<WindowResizeEvent>("window-resize");

    if (windowResizeEvent !== undefined) {
        const { canvas } = world.readData<AppCanvasData>("app-canvas");

        canvas.width = windowResizeEvent.width;
        canvas.height = windowResizeEvent.height;
    }
}

function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    attributes?: Record<string, string>,
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);

    for (const qualifiedName in attributes) {
        element.setAttribute(qualifiedName, attributes[qualifiedName]);
    }

    return element;
}

export class AppMainModule implements WorldModule {
    public readonly moduleId = "app-main-input";

    public setup(world: World): void {
        world.addModules([new TimeModule(), new InputModule(), new AppInputModule()]);

        world.registerData<AppMainData>("app-main");
        world.registerData<AppMainInputData>("app-main-input");
        world.registerData<AppCanvasData>("app-canvas");
        world.registerData<AppStateData>("app-state");

        world.registerEvent<AppCommandEvent>("app-command");
        world.registerEvent<WindowResizeEvent>("window-resize");

        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: initAppMainPreSystem });
        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: addAppInputsSystem });
        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: writeAppStateSystem });
        world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: initAppMainPostSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: writeAppStateSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-post", fn: appMainSystem });

        world.addDependency({
            stage: "start-pre",
            seq: [initAppMainPreSystem, addAppInputsSystem, writeAppStateSystem],
        });
        world.addDependency({
            stage: "start-post",
            seq: [startInputElementsSystem, initAppMainPostSystem],
        });
    }
}

export class AppRemoteModule implements WorldModule {
    public readonly moduleId = "app-remote";

    public setup(world: World): void {
        world.addModules([new TimeModule(), new InputModule()]);

        world.registerData<AppCanvasData>("app-canvas");
        world.registerData<AppStateData>("app-state");

        world.registerEvent<AppCommandEvent>("app-command");
        world.registerEvent<WindowResizeEvent>("window-resize");

        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: initAppRemoteSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: resizeCanvasSystem });
    }
}

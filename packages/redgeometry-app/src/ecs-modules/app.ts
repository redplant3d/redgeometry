import type { DefaultSystemStage, DefaultWorldScheduleId, WorldModule } from "../ecs/types.js";
import type { World } from "../ecs/world.js";
import { createRandomSeed } from "../utility/helper.js";
import {
    AppInputModule,
    ButtonInputElement,
    ComboBoxInputElement,
    TextBoxInputElement,
    startInputElementsSystem,
    type AppInputData,
} from "./app-input.js";
import type { AppLauncherData } from "./app-launcher.js";
import { InputModule, type InputInitData } from "./input.js";
import { TimeModule, type AnimationFrameEvent } from "./time.js";

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
    canvas: HTMLCanvasElement;
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
        canvas,
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

        world.writeEvent<WindowResizeEvent>({
            eventId: "window-resize",
            width: canvasContainer.clientWidth,
            height: canvasContainer.clientHeight,
        });
    });

    world.writeData<InputInitData>({
        dataId: "input-init",
        keyboardEventHandler: self,
        mouseEventHandler: canvas,
    });
}

export function addAppInputsSystem(world: World): void {
    const seed = createRandomSeed();

    const { inputElements } = world.readData<AppInputData>("app-input");
    const { appPartIds, appPartId } = world.readData<AppLauncherData>("app-launcher");

    const inputAppComboBox = new ComboBoxInputElement("app-main", appPartId);
    inputAppComboBox.setOptionValues(...appPartIds);
    inputAppComboBox.addEventListener("input", () => {
        window.location.replace("?app=" + inputAppComboBox.getValue());
    });
    inputElements.push(inputAppComboBox);

    const randomizeButton = new ButtonInputElement("randomize", "randomize");
    randomizeButton.addEventListener("click", () => {
        world.writeEvent<AppCommandEvent>({ eventId: "app-command", command: "randomize" });
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
        world.writeEvent<AppCommandEvent>({ eventId: "app-command", command: "update" });
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
    requestAnimationFrame((time) => {
        world.writeEvent<AnimationFrameEvent>({ eventId: "animation-frame", time });
        world.runSchedule<DefaultWorldScheduleId>("update");
    });
}

export async function appMainSystem(world: World): Promise<void> {
    requestAnimationFrame((time) => {
        world.writeEvent<AnimationFrameEvent>({ eventId: "animation-frame", time });
        world.runSchedule<DefaultWorldScheduleId>("update");
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

        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: resizeCanvasSystem });
    }
}

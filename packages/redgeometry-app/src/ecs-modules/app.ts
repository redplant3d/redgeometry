import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import type { World } from "../ecs/world.ts";
import { createRandomSeed } from "../utility/helper.ts";
import { AppContextModule } from "./app-context.ts";
import {
    AppInputModule,
    ButtonInputElement,
    ComboBoxInputElement,
    TextBoxInputElement,
    type AppInputData,
} from "./app-input.ts";
import { InputModule, type InputInitData } from "./input.ts";
import { TimeModule } from "./time.ts";

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

export type AppCanvasData = {
    dataId: "app-canvas-data";
    canvas: HTMLCanvasElement;
};

export type AppStateData = {
    dataId: "app-state-data";
    generator: number;
    seed: number;
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
        dataId: "app-canvas-data",
        canvas,
    });

    canvasContainer.appendChild(canvas);

    world.writeData<AppMainData>({
        dataId: "app-main-data",
        canvas,
        canvasContainer,
        urlSearchParams,
    });

    world.writeData<AppInputData>({
        dataId: "app-input-data",
        paramsContainer,
        inputElements: [],
    });

    world.writeEvent<WindowResizeEvent>({
        eventId: "window-resize-event",
        width: canvasContainer.clientWidth,
        height: canvasContainer.clientHeight,
    });

    window.addEventListener("resize", () => {
        const { canvasContainer } = world.readData<AppMainData>("app-main-data");

        world.writeEvent<WindowResizeEvent>({
            eventId: "window-resize-event",
            width: canvasContainer.clientWidth,
            height: canvasContainer.clientHeight,
        });
    });

    world.writeData<InputInitData>({
        dataId: "input-init-data",
        keyboardEventHandler: self,
        mouseEventHandler: canvas,
    });
}

export function addAppInputsSystem(world: World): void {
    const seed = createRandomSeed();

    const { inputElements } = world.readData<AppInputData>("app-input-data");
    const { appPartIds, appPartId } = world.readData<AppLauncherData>("app-launcher-data");

    const inputAppComboBox = new ComboBoxInputElement("app-main-data", appPartId);
    inputAppComboBox.setOptionValues(...appPartIds);
    inputAppComboBox.addEventListener("input", () => {
        window.location.replace("?app=" + inputAppComboBox.getValue());
    });
    inputElements.push(inputAppComboBox);

    const randomizeButton = new ButtonInputElement("randomize", "randomize");
    randomizeButton.addEventListener("click", () => {
        world.writeEvent<AppCommandEvent>({ eventId: "app-command-event", command: "randomize" });
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
        world.writeEvent<AppCommandEvent>({ eventId: "app-command-event", command: "update" });
    });
    inputElements.push(updateButton);

    world.writeData<AppMainInputData>({
        dataId: "app-main-input-data",
        appComboBox: inputAppComboBox,
        randomizeButton,
        seedTextBox,
        generatorTextBox,
        updateButton,
    });
}

export function writeAppStateSystem(world: World): void {
    const { generatorTextBox, seedTextBox } = world.readData<AppMainInputData>("app-main-input-data");

    world.writeData<AppStateData>({
        dataId: "app-state-data",
        seed: seedTextBox.getInt(),
        generator: generatorTextBox.getInt(),
    });
}

export function resizeCanvasSystem(world: World): void {
    const windowResizeEvent = world.readLatestEvent<WindowResizeEvent>("window-resize-event");

    if (windowResizeEvent !== undefined) {
        const { canvas } = world.readData<AppCanvasData>("app-canvas-data");

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

export class AppModule implements WorldModule {
    public readonly moduleId = "app-main-input-data";

    private appPartIds: string[];
    private appPartId: string;

    public constructor(appPartIds: string[], appPartId: string) {
        this.appPartIds = appPartIds;
        this.appPartId = appPartId;
    }

    public setup(world: World): void {
        world.addModules([new TimeModule(), new InputModule(), new AppInputModule(), new AppContextModule()]);

        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: initAppMainPreSystem });
        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: addAppInputsSystem });
        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: writeAppStateSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: writeAppStateSystem });

        world.addDependency({
            stage: "start-pre",
            seq: [initAppMainPreSystem, addAppInputsSystem, writeAppStateSystem],
        });

        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: resizeCanvasSystem });

        world.writeData<AppLauncherData>({
            dataId: "app-launcher-data",
            appPartIds: this.appPartIds,
            appPartId: this.appPartId,
            requestExit: false,
        });
    }
}

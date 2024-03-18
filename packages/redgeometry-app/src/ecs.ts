import type { TimeData } from "redgeometry/src/ecs-plugins/time";
import type { DefaultSystemStage } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import type { AppInputElement } from "./input.js";

export function appMainPlugin(world: World): void {
    world.registerData<AppData>("app");
    world.registerData<AppInputElementData>("appInputElement");
    world.registerData<AppCanvasData>("appCanvas");

    world.registerEvent<WindowResizeEvent>("windowResize");

    world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: initAppSystem });
    world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: initInputElementsSystem });
}

export function appRemotePlugin(world: World): void {
    world.registerData<AppCanvasData>("appCanvas");
    world.registerData<TimeData>("time");
    world.registerEvent<WindowResizeEvent>("windowResize");

    world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: resizeWindowSystem });
}

export type AppData = {
    dataId: "app";
    canvas: HTMLCanvasElement;
    canvasContainer: HTMLElement;
    paramsContainer: HTMLElement;
    urlSearchParams: URLSearchParams;
};

export type AppInputElementData = {
    dataId: "appInputElement";
    inputElements: AppInputElement[];
};

export type AppCanvasData = {
    dataId: "appCanvas";
    canvas: HTMLCanvasElement | OffscreenCanvas;
};

export type WindowResizeEvent = {
    eventId: "windowResize";
    width: number;
    height: number;
};

export function initAppSystem(world: World): void {
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
    const offscreenCanvas = canvas.transferControlToOffscreen();

    world.writeData<AppCanvasData>({
        dataId: "appCanvas",
        canvas: offscreenCanvas,
    });

    canvasContainer.appendChild(canvas);

    world.writeData<AppData>({
        dataId: "app",
        urlSearchParams,
        paramsContainer,
        canvasContainer,
        canvas,
    });

    world.writeData<AppInputElementData>({
        dataId: "appInputElement",
        inputElements: [],
    });

    world.writeEvent<WindowResizeEvent>({
        eventId: "windowResize",
        width: canvasContainer.clientWidth,
        height: canvasContainer.clientHeight,
    });

    window.addEventListener("resize", () => {
        const { canvasContainer } = world.readData<AppData>("app");

        world.queueEvent<WindowResizeEvent>({
            eventId: "windowResize",
            width: canvasContainer.clientWidth,
            height: canvasContainer.clientHeight,
        });
    });
}

export function resizeWindowSystem(world: World): void {
    const windowResizeEvent = world.readLatestEvent<WindowResizeEvent>("windowResize");

    if (windowResizeEvent !== undefined) {
        const { canvas } = world.readData<AppCanvasData>("appCanvas");

        canvas.width = windowResizeEvent.width;
        canvas.height = windowResizeEvent.height;
    }
}

export function initInputElementsSystem(world: World): void {
    const { inputElements } = world.readData<AppInputElementData>("appInputElement");
    const { paramsContainer } = world.readData<AppData>("app");

    for (const inputElement of inputElements) {
        inputElement.register(paramsContainer);
    }
}

export function deinitInputElementsSystem(world: World): void {
    const { inputElements } = world.readData<AppInputElementData>("appInputElement");

    for (const inputElement of inputElements) {
        inputElement.unregister();
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

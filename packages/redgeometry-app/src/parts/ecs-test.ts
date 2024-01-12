import { Path2 } from "redgeometry/src/core/path";
import { hasChangeFlag } from "redgeometry/src/ecs/helper";
import { ChangeFlags } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import { Point2 } from "redgeometry/src/primitives/point";
import { Vector2 } from "redgeometry/src/primitives/vector";
import { requestAnimationFrameSystem, timePlugin, type TimeData } from "redgeometry/src/render-webgpu/time";
import { log, throwError } from "redgeometry/src/utility/debug";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import { AppContext2D } from "../context.js";
import { createRandomSeed } from "../data.js";
import {
    appMainPlugin,
    appRemotePlugin,
    initAppSystem,
    initInputElementsSystem,
    resizeWindowSystem,
    type AppCanvasData,
    type AppInputElementData,
    type WindowResizeEvent,
} from "../ecs.js";
import { ButtonInputElement, RangeInputElement, TextBoxInputElement } from "../input.js";

export const ECS_TEST_MAIN_WORLD = {
    id: "ecs-test-main",
    plugins: [appMainPlugin, mainPlugin, timePlugin],
};
export const ECS_TEST_REMOTE_WORLD = {
    id: "ecs-test-remote",
    plugins: [appRemotePlugin, remotePlugin],
};

function mainPlugin(world: World): void {
    world.registerData<AppMainData>("appMain");
    world.registerData<AppStateData>("appState");
    world.registerEvent<AppCommandEvent>("appCommand");

    world.addSystem({ fn: addInputElementsSystem, stage: "start" });
    world.addSystem({ fn: writeStateSystem, stage: "start" });
    world.addSystem({ fn: initMainSystem, stage: "start", mode: "async" });
    world.addSystem({ fn: writeStateSystem });
    world.addSystem({ fn: mainSystem, mode: "async" });

    world.addDependency({
        seq: [initAppSystem, addInputElementsSystem, initInputElementsSystem],
        stage: "start",
    });
    world.addDependency({
        seq: [addInputElementsSystem, writeStateSystem],
        stage: "start",
    });
    world.addDependency({
        seq: [writeStateSystem, initMainSystem, requestAnimationFrameSystem],
        stage: "start",
    });
    world.addDependency({
        seq: [writeStateSystem, mainSystem, requestAnimationFrameSystem],
    });
}

function remotePlugin(world: World): void {
    world.registerData<AppRemoteData>("appRemote");
    world.registerData<AppStateData>("appState");
    world.registerEvent<AppCommandEvent>("appCommand");

    world.registerSerializable(Vector2);
    world.registerSerializable(Point2);

    world.addSystem({ fn: initRemoteSystem, stage: "start" });
    world.addSystem({ fn: spawnSystem });
    world.addSystem({ fn: movementSystem });
    world.addSystem({ fn: commandEventSystem });
    world.addSystem({ fn: clearRenderSystem });
    world.addSystem({ fn: circleRenderSystem });
    world.addSystem({ fn: rectangleRenderSystem });
    world.addSystem({ fn: notificationSystem });

    world.addDependency({
        seq: [commandEventSystem, spawnSystem, movementSystem, clearRenderSystem],
    });
    world.addDependency({
        seq: [resizeWindowSystem, clearRenderSystem, rectangleRenderSystem, circleRenderSystem],
    });
    world.addDependency({
        seq: [spawnSystem, notificationSystem],
    });
}

type AppMainData = {
    dataId: "appMain";
    countRange: RangeInputElement;
    generatorTextBox: TextBoxInputElement;
    loadButton: ButtonInputElement;
    randomizeButton: ButtonInputElement;
    saveButton: ButtonInputElement;
    seedTextBox: TextBoxInputElement;
    updateButton: ButtonInputElement;
};

type AppRemoteData = {
    dataId: "appRemote";
    appContext: AppContext2D;
    count: number;
    json: string | undefined;
    random: Random;
};

type AppStateData = {
    dataId: "appState";
    count: number;
    seed: number;
};

type AppCommandEvent = {
    eventId: "appCommand";
    command: "randomize" | "update" | "save" | "load";
};

type CircleComponent = {
    componentId: "circle";
};

type RectangleComponent = {
    componentId: "rectangle";
};

type ObjectComponent = {
    componentId: "object";
    color: string;
    position: Point2;
    size: number;
    velocity: Vector2;
};

function initMainSystem(world: World): Promise<void> {
    const appStateData = world.readData<AppStateData>("appState");
    const appCanvasData = world.readData<AppCanvasData>("appCanvas");

    const channel = world.getChannel(ECS_TEST_REMOTE_WORLD.id);
    channel.queueData<AppStateData>(appStateData);

    if (appCanvasData.canvas instanceof OffscreenCanvas) {
        channel.queueData<AppCanvasData>(appCanvasData, [appCanvasData.canvas]);
    } else {
        channel.queueData<AppCanvasData>(appCanvasData);
    }

    return channel.runStageAsync("start");
}

function initRemoteSystem(world: World): void {
    const { canvas } = world.readData<AppCanvasData>("appCanvas");
    const { seed } = world.readData<AppStateData>("appState");

    const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | null;

    if (context === null) {
        throwError("Unable to create app rendering context");
    }

    world.writeData<AppRemoteData>({
        dataId: "appRemote",
        appContext: new AppContext2D(context),
        count: 0,
        json: undefined,
        random: RandomXSR128.fromSeedLcg(seed),
    });
}

function addInputElementsSystem(world: World): void {
    const seed = createRandomSeed();

    const { inputElements } = world.readData<AppInputElementData>("appInputElement");

    const randomizeButton = new ButtonInputElement("randomize", "randomize");
    randomizeButton.addEventListener("click", () =>
        world.queueEvent<AppCommandEvent>({ eventId: "appCommand", command: "randomize" }),
    );
    inputElements.push(randomizeButton);

    const seedTextBox = new TextBoxInputElement("seed", seed.toString());
    seedTextBox.setStyle("width: 80px");
    inputElements.push(seedTextBox);

    const generatorTextBox = new TextBoxInputElement("generator", "0");
    generatorTextBox.setStyle("width: 25px");
    inputElements.push(generatorTextBox);

    const updateButton = new ButtonInputElement("update", "update");
    updateButton.addEventListener("click", () =>
        world.queueEvent<AppCommandEvent>({ eventId: "appCommand", command: "update" }),
    );
    inputElements.push(updateButton);

    const countRange = new RangeInputElement("count", "0", "1000", "10");
    countRange.setStyle("width: 200px");
    inputElements.push(countRange);

    const saveButton = new ButtonInputElement("save", "save");
    saveButton.addEventListener("click", () =>
        world.queueEvent<AppCommandEvent>({ eventId: "appCommand", command: "save" }),
    );
    inputElements.push(saveButton);

    const loadButton = new ButtonInputElement("load", "load");
    loadButton.addEventListener("click", () =>
        world.queueEvent<AppCommandEvent>({ eventId: "appCommand", command: "load" }),
    );
    inputElements.push(loadButton);

    world.writeData<AppMainData>({
        dataId: "appMain",
        randomizeButton,
        seedTextBox,
        generatorTextBox,
        updateButton,
        countRange,
        saveButton,
        loadButton,
    });
}

function writeStateSystem(world: World): void {
    const appMainData = world.readData<AppMainData>("appMain");

    world.writeData<AppStateData>({
        dataId: "appState",
        count: appMainData.countRange.getInt(),
        seed: appMainData.seedTextBox.getInt(),
    });
}

function mainSystem(world: World): Promise<void> {
    const timeData = world.readData<TimeData>("time");
    const appStateData = world.readData<AppStateData>("appState");
    const windowResizeEvents = world.readEvents<WindowResizeEvent>("windowResize");
    const appCommandEvents = world.readEvents<AppCommandEvent>("appCommand");

    const channel = world.getChannel(ECS_TEST_REMOTE_WORLD.id);
    channel.queueData(timeData);
    channel.queueData(appStateData);
    channel.queueEvents(windowResizeEvents);
    channel.queueEvents(appCommandEvents);

    return channel.runStageAsync("update");
}

function spawnSystem(world: World): void {
    const appRemoteData = world.readData<AppRemoteData>("appRemote");
    const appStateData = world.readData<AppStateData>("appState");

    const { random, appContext } = appRemoteData;

    const currCount = appRemoteData.count;
    const nextCount = appStateData.count;

    if (currCount <= nextCount) {
        for (let i = currCount; i < nextCount; i++) {
            const shape = random.nextFloat() < 0.8 ? "rectangle" : "circle";
            const size = random.nextFloatBetween(10, 100);
            const color = random.nextFloat() < 0.5 ? "red" : "blue";
            const position = new Point2(
                random.nextFloatBetween(0, appContext.canvas.width),
                random.nextFloatBetween(0, appContext.canvas.height),
            );
            const velocity = new Vector2(random.nextFloatBetween(-1, 1), random.nextFloatBetween(-1, 1));

            world.createEntity<[CircleComponent | RectangleComponent, ObjectComponent]>(
                { componentId: shape },
                { componentId: "object", size, color, position, velocity },
            );
        }
    } else {
        const query = world.queryEntities<[ObjectComponent]>(["object"]);

        let i = nextCount;

        for (const entry of query) {
            if (i < currCount) {
                world.destroyEntity(entry.entity);
                i += 1;
            }
        }
    }

    appRemoteData.count = nextCount;
}

function movementSystem(world: World): void {
    const { appContext } = world.readData<AppRemoteData>("appRemote");
    const { delta } = world.readData<TimeData>("time");

    const { width, height } = appContext.canvas;

    const query = world.queryEntities<[ObjectComponent]>(["object"]);

    for (const { entity, components } of query) {
        const p = components.object.position;
        const v = components.object.velocity;
        const d = 0.5 * components.object.size;

        let vx = v.x;
        let vy = v.y;
        let px = p.x + delta * vx;
        let py = p.y + delta * vy;

        if (px > width - d) {
            px = width - d;
            vx = -vx;
        } else if (px < d) {
            px = d;
            vx = -vx;
        }

        if (py > height - d) {
            py = height - d;
            vy = -vy;
        } else if (py < d) {
            py = d;
            vy = -vy;
        }

        components.object.position = new Point2(px, py);
        components.object.velocity = new Vector2(vx, vy);

        world.updateComponent<ObjectComponent>(entity, "object");
    }
}

function commandEventSystem(world: World): void {
    const appRemoteData = world.readData<AppRemoteData>("appRemote");
    const appCommandEvents = world.readEvents<AppCommandEvent>("appCommand");

    for (const e of appCommandEvents) {
        switch (e.command) {
            case "save": {
                console.time("saveEntities");
                appRemoteData.json = world.saveEntities();
                console.timeEnd("saveEntities");

                log.info("World saved ({} bytes)", appRemoteData.json.length);

                break;
            }
            case "load": {
                if (appRemoteData.json === undefined) {
                    break;
                }

                console.time("loadEntities");
                world.loadEntities(appRemoteData.json);
                console.timeEnd("loadEntities");

                log.info("World loaded ({} bytes)", appRemoteData.json.length);

                break;
            }
        }
    }
}

function clearRenderSystem(world: World): void {
    const { appContext } = world.readData<AppRemoteData>("appRemote");

    appContext.clear();
}

function circleRenderSystem(world: World): void {
    const { appContext } = world.readData<AppRemoteData>("appRemote");
    const query = world.queryEntities<[CircleComponent, ObjectComponent]>(["circle", "object"]);

    const red = new Path2();
    const blue = new Path2();

    for (const { components } of query) {
        const p = components.object.position;
        const d = components.object.size;
        const c = components.object.color;

        if (c === "red") {
            red.addCircle(p, 0.5 * d);
        } else if (c === "blue") {
            blue.addCircle(p, 0.5 * d);
        }
    }

    appContext.fillPath(red, "red");
    appContext.fillPath(blue, "blue");
}

function rectangleRenderSystem(world: World): void {
    const { appContext } = world.readData<AppRemoteData>("appRemote");
    const query = world.queryEntities<[RectangleComponent, ObjectComponent]>(["rectangle", "object"]);

    const red = new Path2();
    const blue = new Path2();

    for (const { components } of query) {
        const p = components.object.position;
        const d = components.object.size;
        const c = components.object.color;

        const x0 = p.x - 0.5 * d;
        const y0 = p.y - 0.5 * d;
        const x1 = p.x + 0.5 * d;
        const y1 = p.y + 0.5 * d;

        if (c === "red") {
            red.addRectXY(x0, y0, x1, y1);
        } else if (c === "blue") {
            blue.addRectXY(x0, y0, x1, y1);
        }
    }

    appContext.fillPath(red, "red");
    appContext.fillPath(blue, "blue");
}

function notificationSystem(world: World): void {
    const changed = world.queryEntitiesChanged<[ObjectComponent]>(["object"]);

    let createdCount = 0;
    let deletedCount = 0;

    for (const { changeset } of changed) {
        if (hasChangeFlag(changeset.object, ChangeFlags.Created)) {
            createdCount += 1;
        } else if (hasChangeFlag(changeset.object, ChangeFlags.Deleted)) {
            deletedCount += 1;
        }
    }

    if (createdCount > 0 || deletedCount > 0) {
        log.info("created = {}, deleted = {}", createdCount, deletedCount);
    }
}

import { Path2 } from "redgeometry/src/core/path";
import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, DefaultWorldScheduleId } from "redgeometry/src/ecs/types";
import {
    ChangeFlags,
    DEFAULT_START_SCHEDULE,
    DEFAULT_STOP_SCHEDULE,
    DEFAULT_UPDATE_SCHEDULE,
    type World,
} from "redgeometry/src/ecs/world";
import { Point2 } from "redgeometry/src/primitives/point";
import { Vector2 } from "redgeometry/src/primitives/vector";
import { timePlugin, type TimeData } from "redgeometry/src/render-webgpu/time";
import { log, throwError } from "redgeometry/src/utility/debug";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import { AppContext2D } from "../context.js";
import { createRandomSeed } from "../data.js";
import {
    appMainPlugin,
    appRemotePlugin,
    type AppCanvasData,
    type AppInputElementData,
    type WindowResizeEvent,
} from "../ecs.js";
import { ButtonInputElement, RangeInputElement, TextBoxInputElement } from "../input.js";

export const ECS_TEST_MAIN_WORLD: WorldOptions = {
    id: "ecs-test-main",
    plugins: [appMainPlugin, mainPlugin, timePlugin],
    schedules: [DEFAULT_START_SCHEDULE, DEFAULT_UPDATE_SCHEDULE, DEFAULT_STOP_SCHEDULE],
};
export const ECS_TEST_REMOTE_WORLD: WorldOptions = {
    id: "ecs-test-remote",
    plugins: [appRemotePlugin, remotePlugin],
    schedules: [DEFAULT_START_SCHEDULE, DEFAULT_UPDATE_SCHEDULE, DEFAULT_STOP_SCHEDULE],
};

function mainPlugin(world: World): void {
    world.registerData<AppMainData>("appMain");
    world.registerData<AppStateData>("appState");
    world.registerEvent<AppCommandEvent>("appCommand");

    world.addSystem<DefaultSystemStage>({ stage: "start", fn: addInputElementsSystem });
    world.addSystem<DefaultSystemStage>({ stage: "start", fn: writeStateSystem });
    world.addSystem<DefaultSystemStage>({ stage: "start", fn: initMainSystem, awaitMode: "dependency" });

    world.addSystem<DefaultSystemStage>({ stage: "update", fn: writeStateSystem });
    world.addSystem<DefaultSystemStage>({ stage: "update", fn: mainSystem, awaitMode: "dependency" });

    world.addDependency<DefaultSystemStage>({
        stage: "start",
        seq: [addInputElementsSystem, writeStateSystem, initMainSystem],
    });
    world.addDependency<DefaultSystemStage>({
        stage: "update",
        seq: [writeStateSystem, mainSystem],
    });
}

function remotePlugin(world: World): void {
    world.registerData<AppRemoteData>("appRemote");
    world.registerData<AppStateData>("appState");
    world.registerEvent<AppCommandEvent>("appCommand");

    world.registerSerializable(Vector2);
    world.registerSerializable(Point2);

    world.addSystem<DefaultSystemStage>({ stage: "start", fn: initRemoteSystem });

    world.addSystems<DefaultSystemStage>({
        stage: "update",
        fns: [
            spawnSystem,
            movementSystem,
            commandEventSystem,
            clearRenderSystem,
            circleRenderSystem,
            rectangleRenderSystem,
            notificationSystem,
        ],
    });

    world.addDependency<DefaultSystemStage>({
        stage: "update",
        seq: [commandEventSystem, spawnSystem, movementSystem, clearRenderSystem],
    });
    world.addDependency<DefaultSystemStage>({
        stage: "update",
        seq: [clearRenderSystem, rectangleRenderSystem, circleRenderSystem],
    });
    world.addDependency<DefaultSystemStage>({
        stage: "update",
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

    return channel.runScheduleAsync<DefaultWorldScheduleId>("start");
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

    return channel.runScheduleAsync<DefaultWorldScheduleId>("update");
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
                undefined,
                { componentId: shape },
                { componentId: "object", size, color, position, velocity },
            );
        }
    } else {
        const query = world.queryEntities<[ObjectComponent]>(["object"]);

        let i = nextCount;

        while (query.next()) {
            const entityId = query.getEntityId();

            if (i < currCount) {
                world.destroyEntity(entityId);
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

    while (query.next()) {
        const entityId = query.getEntityId();
        const object = world.getComponent<ObjectComponent>(entityId, "object");

        if (object === undefined) {
            continue;
        }

        const p = object.position;
        const v = object.velocity;
        const d = 0.5 * object.size;

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

        object.position = new Point2(px, py);
        object.velocity = new Vector2(vx, vy);

        world.updateComponent<ObjectComponent>(entityId, "object");
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

    const red = Path2.createEmpty();
    const blue = Path2.createEmpty();

    while (query.next()) {
        const entityId = query.getEntityId();
        const object = world.getComponent<ObjectComponent>(entityId, "object");

        if (object === undefined) {
            continue;
        }

        const p = object.position;
        const d = object.size;
        const c = object.color;

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

    const red = Path2.createEmpty();
    const blue = Path2.createEmpty();

    while (query.next()) {
        const entityId = query.getEntityId();
        const object = world.getComponent<ObjectComponent>(entityId, "object");

        if (object === undefined) {
            continue;
        }

        const p = object.position;
        const d = object.size;
        const c = object.color;

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
    let createdCount = 0;
    let deletedCount = 0;

    for (const entityId of world.getEntitiesChanged()) {
        if (world.hasChangeFlag<ObjectComponent>(entityId, "object", ChangeFlags.Created)) {
            createdCount += 1;
        }

        if (world.hasChangeFlag<ObjectComponent>(entityId, "object", ChangeFlags.Deleted)) {
            deletedCount += 1;
        }
    }

    if (createdCount > 0 || deletedCount > 0) {
        log.info("created = {}, deleted = {}", createdCount, deletedCount);
    }
}

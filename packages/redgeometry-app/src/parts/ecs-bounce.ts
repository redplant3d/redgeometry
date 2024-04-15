import { Path2 } from "redgeometry/src/core/path";
import { Point2 } from "redgeometry/src/primitives/point";
import { Vector2 } from "redgeometry/src/primitives/vector";
import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import { AppContextModule, AppContextPlugin } from "../ecs-modules/app-context.js";
import type { AppInputData } from "../ecs-modules/app-input.js";
import { ButtonInputElement, RangeInputElement } from "../ecs-modules/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs-modules/app.js";
import { type TimeData } from "../ecs-modules/time.js";
import type { WorldOptions } from "../ecs/app.js";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.js";
import { ChangeFlags, DEFAULT_WORLD_SCHEDULES, type World } from "../ecs/world.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputCount: RangeInputElement;
    inputLoad: ButtonInputElement;
    inputSave: ButtonInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    count: number;
    json: string | undefined;
    random: Random;
};

type AppPartStateData = {
    dataId: "app-part-state";
    count: number;
};

type AppPartCommandEvent = {
    eventId: "app-part-command";
    command: "save" | "load";
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

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputCount = new RangeInputElement("count", "0", "1000", "10");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    const inputSave = new ButtonInputElement("save", "save");
    inputSave.addEventListener("click", () =>
        world.queueEvent<AppPartCommandEvent>({ eventId: "app-part-command", command: "save" }),
    );
    inputElements.push(inputSave);

    const inputLoad = new ButtonInputElement("load", "load");
    inputLoad.addEventListener("click", () =>
        world.queueEvent<AppPartCommandEvent>({ eventId: "app-part-command", command: "load" }),
    );
    inputElements.push(inputLoad);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputCount,
        inputSave,
        inputLoad,
    });
}

function initRemoteSystem(world: World): void {
    const { seed } = world.readData<AppStateData>("app-state");

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        count: 0,
        json: undefined,
        random: RandomXSR128.fromSeedLcg(seed),
    });
}

function writeStateSystem(world: World): void {
    const inputData = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        count: inputData.inputCount.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function spawnSystem(world: World): void {
    const appRemoteData = world.readData<AppPartRemoteData>("app-part-remote");
    const appStateData = world.readData<AppPartStateData>("app-part-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const { random } = appRemoteData;

    const currCount = appRemoteData.count;
    const nextCount = appStateData.count;

    if (currCount <= nextCount) {
        for (let i = currCount; i < nextCount; i++) {
            const shape = random.nextFloat() < 0.8 ? "rectangle" : "circle";
            const size = random.nextFloatBetween(10, 100);
            const color = random.nextFloat() < 0.5 ? "red" : "blue";
            const position = new Point2(
                random.nextFloatBetween(0, ctx.canvas.width),
                random.nextFloatBetween(0, ctx.canvas.height),
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
    const { delta } = world.readData<TimeData>("time");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const { width, height } = ctx.canvas;

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
    const appRemoteData = world.readData<AppPartRemoteData>("app-part-remote");
    const appCommandEvents = world.readEvents<AppPartCommandEvent>("app-part-command");

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
    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
}

function circleRenderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context");

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

    ctx.fillPath(red, "red");
    ctx.fillPath(blue, "blue");
}

function rectangleRenderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context");

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

    ctx.fillPath(red, "red");
    ctx.fillPath(blue, "blue");
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

class AppPartMainModule implements WorldModule {
    public readonly moduleId = "main";

    public setup(world: World): void {
        world.registerData<AppPartStateData>("app-part-state");
        world.registerData<AppPartMainData>("app-part-main");
        world.registerEvent<AppPartCommandEvent>("app-part-command");

        world.addSystem<DefaultSystemStage>({ stage: "start", fn: initMainSystem });
        world.addSystem<DefaultSystemStage>({ stage: "start", fn: writeStateSystem });

        world.addSystem<DefaultSystemStage>({ stage: "update", fn: writeStateSystem });

        world.addDependency<DefaultSystemStage>({
            stage: "start",
            seq: [initMainSystem, writeStateSystem],
        });
    }
}

class AppPartRemoteModule implements WorldModule {
    public readonly moduleId = "remote";

    public setup(world: World): void {
        world.addModules([new AppContextModule()]);

        world.registerData<AppPartRemoteData>("app-part-remote");
        world.registerData<AppPartStateData>("app-part-state");
        world.registerEvent<AppPartCommandEvent>("app-part-command");

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
}

export const ECS_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const ECS_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

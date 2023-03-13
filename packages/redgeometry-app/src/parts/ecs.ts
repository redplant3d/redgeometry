import { Path2 } from "redgeometry/src/core";
import { ChangeFlags, hasChangeFlag, System, TimeData, timePlugin, World } from "redgeometry/src/ecs";
import { Point2, Vector2 } from "redgeometry/src/primitives";
import { Debug, Random, RandomXSR128 } from "redgeometry/src/utility";
import { AppContext2D } from "../context";
import { ButtonInputElement, RangeInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";

export class EcsAppPart implements AppPart {
    private context: AppContext2D;
    private json: string | undefined;
    private world: World;

    public inputCount: RangeInputElement;
    public inputLoad: ButtonInputElement;
    public inputSave: ButtonInputElement;
    public launcher: AppLauncher;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputCount = new RangeInputElement("count", "0", "10000", "10");
        this.inputCount.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputCount.setStyle("width: 200px");

        this.inputSave = new ButtonInputElement("save", "save");
        this.inputSave.addEventListener("click", () => this.onSaveClick());

        this.inputLoad = new ButtonInputElement("load", "load");
        this.inputLoad.addEventListener("click", () => this.onLoadClick());

        this.world = new World();
        this.world.addPlugin(timePlugin);
        this.world.registerSerializable(Vector2);
        this.world.registerSerializable(Point2);
        this.world.registerData<AppContextData>("appContext");
        this.world.registerEvent<HelloEvent>("hello");
        this.world.addSystem({ fn: initializeSystem, startup: true, args: [this, this.context] });
        this.world.addSystem({ fn: spawnSystem });
        this.world.addSystem({ fn: movementSystem });
        this.world.addSystem({ fn: clearRenderSystem });
        this.world.addSystem({ fn: circleRenderSystem });
        this.world.addSystem({ fn: rectangleRenderSystem });
        this.world.addSystem({ fn: notificationSystem });
    }

    public create(): void {
        this.reset();

        this.world.start();
    }

    public render(): void {
        return;
    }

    public reset(): void {
        this.world.clearEntities();
    }

    public update(_delta: number): void {
        return;
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputCount);
        this.launcher.addAppInput(this.inputSave);
        this.launcher.addAppInput(this.inputLoad);
    }

    private onLoadClick(): void {
        if (this.json === undefined) {
            return;
        }

        console.time("loadEntities");
        this.world.loadEntities(this.json);
        console.timeEnd("loadEntities");

        Debug.log("World loaded ({} bytes)", this.json.length);
    }

    private onSaveClick(): void {
        console.time("saveEntities");
        this.json = this.world.saveEntities();
        console.timeEnd("saveEntities");

        Debug.log("World saved ({} bytes)", this.json.length);
    }
}

interface AppContextData {
    context: AppContext2D;
    dataId: "appContext";
    part: EcsAppPart;
    random: Random;
    count: number;
}

interface HelloEvent {
    eventId: "hello";
    sender: System;
}

interface CircleComponent {
    componentId: "circle";
}

interface RectangleComponent {
    componentId: "rectangle";
}

interface ObjectComponent {
    componentId: "object";
    size: number;
    color: string;
    position: Point2;
    velocity: Vector2;
}

function initializeSystem(world: World, part: EcsAppPart, context: AppContext2D): void {
    const seed = part.launcher.inputSeed.getInt();
    const random = RandomXSR128.fromSeedLcg(seed);

    world.writeData<AppContextData>({ dataId: "appContext", part, context, random, count: 0 });

    world.writeEvent<HelloEvent>({ eventId: "hello", sender: initializeSystem });
}

function spawnSystem(world: World): void {
    const appContext = world.readData<AppContextData>("appContext");
    const { part, context, count, random } = appContext;

    const newCount = part.inputCount.getInt();
    const [width, height] = context.getSize(true);

    if (count <= newCount) {
        for (let i = count; i < newCount; i++) {
            const shape = random.nextFloat() < 0.8 ? "rectangle" : "circle";
            const size = random.nextFloatBetween(10, 100);
            const color = random.nextFloat() < 0.5 ? "red" : "blue";
            const position = new Point2(random.nextFloatBetween(0, width), random.nextFloatBetween(0, height));
            const velocity = new Vector2(random.nextFloatBetween(-1, 1), random.nextFloatBetween(-1, 1));

            world.createEntity<[CircleComponent | RectangleComponent, ObjectComponent]>(
                { componentId: shape },
                { componentId: "object", size, color, position, velocity }
            );
        }
    } else {
        const query = world.queryEntities<[ObjectComponent]>(["object"]);

        let i = newCount;

        for (const entry of query) {
            if (i < count) {
                world.destroyEntity(entry.entity);
                i += 1;
            }
        }
    }

    appContext.count = newCount;
}

function movementSystem(world: World): void {
    const { context } = world.readData<AppContextData>("appContext");
    const { delta } = world.readData<TimeData>("time");

    const [width, height] = context.getSize(true);

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

function clearRenderSystem(world: World): void {
    const { context } = world.readData<AppContextData>("appContext");

    context.clear();
}

function circleRenderSystem(world: World): void {
    const { context } = world.readData<AppContextData>("appContext");
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

    context.fillPath(red, "red");
    context.fillPath(blue, "blue");
}

function rectangleRenderSystem(world: World): void {
    const { context } = world.readData<AppContextData>("appContext");
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

    context.fillPath(red, "red");
    context.fillPath(blue, "blue");
}

function notificationSystem(world: World): void {
    const events = world.readEvents<HelloEvent>("hello");

    for (const e of events) {
        console.log("Hello from", e.sender.name);
    }

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
        console.log(`created = ${createdCount}, deleted = ${deletedCount}`);
    }
}

import { Path2 } from "redgeometry/src/core";
import { System, World } from "redgeometry/src/ecs";
import { Point2, Vector2 } from "redgeometry/src/primitives";
import { RandomXSR128, log } from "redgeometry/src/utility";
import { AppContext2D } from "../context";
import { ButtonInputElement, TextBoxInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";

export class EcsAppPart implements AppPart {
    private context: AppContext2D;
    private json: string | undefined;
    private world: World;

    public inputCount: TextBoxInputElement;
    public inputLoad: ButtonInputElement;
    public inputSave: ButtonInputElement;
    public launcher: AppLauncher;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputCount = new TextBoxInputElement("count", "10");
        this.inputCount.setStyle("width: 80px");

        this.inputSave = new ButtonInputElement("save", "save");
        this.inputSave.addEventListener("click", () => this.onSaveClick());

        this.inputLoad = new ButtonInputElement("load", "load");
        this.inputLoad.addEventListener("click", () => this.onLoadClick());

        this.world = new World();
        this.world.addSystem({ fn: initializeSystem, startup: true, args: [this] });
        this.world.addSystem({ fn: movementSystem });
        this.world.addSystem({ fn: circleRenderSystem });
        this.world.addSystem({ fn: rectangleRenderSystem });
        this.world.addSystem({ fn: helloSystem });
        this.world.registerData<AppContextData>({ dataId: "appContext", context });
        this.world.registerData<TimeData>({ dataId: "time", delta: 0 });
        this.world.registerEvent<HelloEvent>("hello");
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

    public update(delta: number): void {
        this.context.clear();

        this.world.writeData<TimeData>({ dataId: "time", delta });
        this.world.update();
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
        log.info("World loaded ({} bytes)", this.json.length);
    }

    private onSaveClick(): void {
        console.time("saveEntities");
        this.json = this.world.saveEntities();
        console.timeEnd("saveEntities");
        log.info("World saved ({} bytes)", this.json.length);
    }
}

interface AppContextData {
    context: AppContext2D;
    dataId: "appContext";
}

interface TimeData {
    dataId: "time";
    delta: number;
}

interface HelloEvent {
    eventId: "hello";
    sender: System;
}

interface PositionComponent {
    componentId: "position";
    value: Point2;
}

interface VelocityComponent {
    componentId: "velocity";
    value: Vector2;
}

interface SizeComponent {
    componentId: "size";
    value: number;
}

interface ColorComponent {
    componentId: "color";
    value: string;
}

interface CircleComponent {
    componentId: "circle";
}

interface RectangleComponent {
    componentId: "rectangle";
}

function initializeSystem(world: World, appPart: EcsAppPart): void {
    const seed = appPart.launcher.inputSeed.getInt();
    const count = appPart.inputCount.getInt();

    const random = RandomXSR128.fromSeedLcg(seed);

    const { context } = world.readData<AppContextData>("appContext");

    const [width, height] = context.getSize(true);

    world.writeEvent<HelloEvent>({ eventId: "hello", sender: initializeSystem });

    for (let i = 0; i < count; i++) {
        const entity = world.createEntity();

        const shape = random.nextFloat() < 0.8 ? "circle" : "rectangle";
        const pos = new Point2(random.nextFloatBetween(0, width), random.nextFloatBetween(0, height));
        const vel = new Vector2(random.nextFloatBetween(-1, 1), random.nextFloatBetween(-1, 1));
        const size = random.nextFloatBetween(10, 100);
        const color = random.nextFloat() < 0.5 ? "red" : "blue";

        world.addComponents<
            [CircleComponent | RectangleComponent, PositionComponent, VelocityComponent, SizeComponent, ColorComponent]
        >(
            entity,
            { componentId: shape },
            { componentId: "position", value: pos },
            { componentId: "velocity", value: vel },
            { componentId: "size", value: size },
            { componentId: "color", value: color }
        );
    }
}

function movementSystem(world: World): void {
    const { context } = world.readData<AppContextData>("appContext");
    const { delta } = world.readData<TimeData>("time");

    const [width, height] = context.getSize(true);

    const query = world.queryEntities<[PositionComponent, VelocityComponent, SizeComponent]>([
        "position",
        "velocity",
        "size",
    ]);

    for (const { components } of query) {
        const p = components.position.value;
        const v = components.velocity.value;
        const d = 0.5 * components.size.value;

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

        components.position.value = new Point2(px, py);
        components.velocity.value = new Vector2(vx, vy);
    }
}

function circleRenderSystem(world: World): void {
    const { context } = world.readData<AppContextData>("appContext");
    const query = world.queryEntities<[CircleComponent, PositionComponent, SizeComponent, ColorComponent]>([
        "circle",
        "position",
        "size",
        "color",
    ]);

    const red = new Path2();
    const blue = new Path2();

    for (const { components } of query) {
        const p = components.position.value;
        const d = components.size.value;
        const c = components.color.value;

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
    const query = world.queryEntities<[RectangleComponent, PositionComponent, SizeComponent, ColorComponent]>([
        "rectangle",
        "position",
        "size",
        "color",
    ]);

    const red = new Path2();
    const blue = new Path2();

    for (const { components } of query) {
        const p = components.position.value;
        const d = components.size.value;
        const c = components.color.value;

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

function helloSystem(world: World): void {
    const events = world.readEvents<HelloEvent>("hello");

    for (const e of events) {
        log.info("Hello from", e.sender.name);
    }
}

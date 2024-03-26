import { SnapRound2, type EdgeSegment2 } from "redgeometry/src/core/snapround";
import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { Bezier1Curve2 } from "redgeometry/src/primitives/bezier";
import { Box2 } from "redgeometry/src/primitives/box";
import { Edge2 } from "redgeometry/src/primitives/edge";
import { Point2 } from "redgeometry/src/primitives/point";
import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs/app-context.js";
import { AppContextModule } from "../ecs/app-context.js";
import { AppMainModule, AppRemoteModule, type AppMainData, type AppStateData } from "../ecs/app.js";
import { RangeInputElement } from "../utility/input.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputParameter: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    errors: Box2[];
    inputSegments: Edge2[];
    intersections: Point2[];
    magnets: Box2[];
    outputSegments: Edge2[];
    pins: Point2[];
};

type AppPartStateData = {
    dataId: "app-part-state";
    parameter: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppMainData>("app-main");

    const inputParameter = new RangeInputElement("parameter", "1", "200", "50");
    inputParameter.setStyle("width: 200px");
    inputElements.push(inputParameter);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputParameter,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        inputSegments: [],
        outputSegments: [],
        intersections: [],
        magnets: [],
        pins: [],
        errors: [],
    });
}

function writeStateSystem(world: World): void {
    const { inputParameter } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        parameter: inputParameter.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { parameter } = world.readData<AppPartStateData>("app-part-state");
    const { seed, generator } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const scale = parameter;
    const precision = 1 / scale;

    const snapRound = new SnapRound2();
    snapRound.precision = precision;

    const [width, height] = ctx.getSize(false);

    fillEdges(generator, seed, snapRound, precision, width, height);

    const start = performance.now();
    snapRound.process();
    const end = performance.now();

    log.info("Snap round time: {} ms", (end - start).toFixed(1));

    const inputSegments = transformSegments(snapRound.debugGetInputSegments(), scale);
    const outputSegments = transformSegments(snapRound.debugGetOutputSegments(), scale);
    const intersections = transformPoints(snapRound.debugGetIntersections(), scale);
    const magnets = transformBox(snapRound.debugGetMagnets(), scale);
    const pins = transformPoints(snapRound.debugGetPins(), scale);
    const errors = transformBox(transformPoints(snapRound.debugGetErrors(), 1), scale);

    log.info("Got {} input edges", inputSegments.length);
    log.info("Found {} intersections, {} magnets and {} pins", intersections.length, magnets.length, pins.length);
    log.info("Created {} output edges", outputSegments.length);

    if (errors.length > 0) {
        log.error("*** {} errors ***", errors.length);
    }

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        inputSegments,
        outputSegments,
        intersections,
        magnets,
        pins,
        errors,
    });
}

function renderSystem(world: World): void {
    const { errors, inputSegments, intersections, magnets, outputSegments, pins } =
        world.readData<AppPartRemoteData>("app-part-remote");
    const { parameter } = world.readData<AppPartStateData>("app-part-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.fillBoxes(magnets, "#E4E4E4");
    ctx.drawEdges(inputSegments, "#888888");
    ctx.fillPoints(pins, "#CCCCCC", 0.25 * parameter);
    ctx.fillBoxes(errors, "#0088FF44");
    ctx.drawEdges(outputSegments);
    ctx.fillEdgePoints(outputSegments, "#000000", 5);
    ctx.fillPoints(intersections, "#FF0000", 5);
}

function addEdge(snapRound: SnapRound2, p0: Point2, p1: Point2, snap = false): void {
    const c = new Bezier1Curve2(p0, p1);
    snapRound.addSegment(c, 0, 1, snap, undefined);
}

function addEdges(snapRound: SnapRound2, edges: Edge2[]): void {
    for (const edge of edges) {
        const c = new Bezier1Curve2(edge.p0, edge.p1);
        snapRound.addSegment(c, 0, 1, false, undefined);
    }
}

function fillEdges(
    generator: number,
    seed: number,
    snapRound: SnapRound2,
    k: number,
    width: number,
    height: number,
): void {
    const random = RandomXSR128.fromSeedLcg(seed);

    switch (generator) {
        case 0: {
            // Generation constants
            const pinProbability = 0.5;
            const from = 10;
            const to = 30;

            const count = random.nextIntBetween(from, to);

            for (let i = 0; i < count; i++) {
                let p0 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                let p1 = new Point2(width * random.nextFloat(), height * random.nextFloat());

                if (random.nextFloat() < pinProbability) {
                    p0 = Point2.roundToPrecision(p0, k);
                }

                if (random.nextFloat() < pinProbability) {
                    p1 = Point2.roundToPrecision(p1, k);
                }

                addEdge(snapRound, p0, p1);
            }
            break;
        }
        case 1: {
            const edges: Edge2[] = [];
            edges.push(Edge2.fromXY(100, 200, 600, 300));
            edges.push(Edge2.fromXY(75, 425, 575, 625));
            edges.push(Edge2.fromXY(100, 500, 300, 100));
            edges.push(Edge2.fromXY(100, 500, 400, 600));
            edges.push(Edge2.fromXY(300, 500, 500, 200));
            addEdges(snapRound, edges);
            break;
        }
        case 2: {
            const edges: Edge2[] = [];
            edges.push(Edge2.fromXY(200, 200, 500, 200));
            edges.push(Edge2.fromXY(500, 200, 500, 500));
            edges.push(Edge2.fromXY(500, 500, 200, 500));
            edges.push(Edge2.fromXY(200, 500, 200, 200));
            edges.push(Edge2.fromXY(300, 220, 400, 220));
            edges.push(Edge2.fromXY(400, 220, 400, 320));
            edges.push(Edge2.fromXY(400, 320, 300, 320));
            edges.push(Edge2.fromXY(300, 320, 300, 220));
            addEdges(snapRound, edges);
            break;
        }
        case 3: {
            const p0 = new Point2(width * random.nextFloat(), height * random.nextFloat());
            const p1 = new Point2(width * random.nextFloat(), height * random.nextFloat());

            const t0 = random.nextFloatBetween(0, 0.5);
            const t1 = random.nextFloatBetween(0.5, 1);

            const pp0 = Point2.roundToPrecision(p0.lerp(p1, t0), k);
            const pp1 = Point2.roundToPrecision(p0.lerp(p1, t1), k);

            addEdge(snapRound, p0, p1);
            addEdge(snapRound, pp0, pp1, true);

            break;
        }
    }
}

function transformBox(points: Point2[], scale: number): Box2[] {
    const result: Box2[] = [];

    for (const point of points) {
        const x = Math.round(scale * (point.x - 0.5));
        const y = Math.round(scale * (point.y - 0.5));
        const d = Math.round(scale);
        result.push(new Box2(x, y, x + d, y + d));
    }

    return result;
}

function transformPoints(points: Point2[], scale: number): Point2[] {
    const result: Point2[] = [];

    for (const point of points) {
        const x0 = Math.round(scale * point.x);
        const y0 = Math.round(scale * point.y);
        result.push(new Point2(x0, y0));
    }

    return result;
}

function transformSegments(segments: EdgeSegment2[], scale: number): Edge2[] {
    const result: Edge2[] = [];

    for (const segment of segments) {
        const x0 = Math.round(scale * segment.p0.x);
        const y0 = Math.round(scale * segment.p0.y);
        const x1 = Math.round(scale * segment.p1.x);
        const y1 = Math.round(scale * segment.p1.y);
        result.push(Edge2.fromXY(x0, y0, x1, y1));
    }

    return result;
}

class AppPartMainModule implements WorldModule {
    public readonly moduleId = "app-part-main";

    public setup(world: World): void {
        world.registerData<AppPartMainData>("app-part-main");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });
    }
}

class AppPartRemoteModule implements WorldModule {
    public readonly moduleId = "app-part-remote";

    public setup(world: World): void {
        world.addModules([new AppContextModule()]);

        world.registerData<AppPartRemoteData>("app-part-remote");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

export const SNAP_ROUNDING_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const SNAP_ROUNDING_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

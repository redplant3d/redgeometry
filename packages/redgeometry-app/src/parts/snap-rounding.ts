import { SnapRound2, type EdgeSegment2 } from "redgeometry/src/core/snapround";
import { log } from "redgeometry/src/internal/log";
import { Bezier1Curve2 } from "redgeometry/src/primitives/bezier";
import { MinMaxBox2, type ReadonlyMinMaxBox2 } from "redgeometry/src/primitives/box";
import { Edge2 } from "redgeometry/src/primitives/edge";
import { Vector2, type ReadonlyVector2 } from "redgeometry/src/primitives/vector";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { APP_INPUT_START_SYSTEM_ID } from "../ecs-modules/app-input.ts";
import {
    APP_MODULE_ID,
    APP_START_SYSTEM_ID,
    APP_UPDATE_SYSTEM_ID,
    appModule,
    START_SCHEDULE_ID,
    UPDATE_SCHEDULE_ID,
    type AppInputData,
    type AppMainInputData,
} from "../ecs-modules/app.ts";
import { WorldContext, type World } from "../ecs/world.ts";
import { RangeInputElement } from "../utility/html-element.ts";

type SnapRoundingInputData = {
    dataId: "snap-rounding-input-data";
    inputParameter: RangeInputElement;
};

type SnapRoundingStateData = {
    dataId: "snap-rounding-state-data";
    errors: ReadonlyMinMaxBox2[];
    inputSegments: Edge2[];
    intersections: ReadonlyVector2[];
    magnets: ReadonlyMinMaxBox2[];
    outputSegments: Edge2[];
    pins: ReadonlyVector2[];
};

const APP_PART_START_SYSTEM_ID = "snap-rounding-start-system";
const APP_PART_UPDATE_SYSTEM_ID = "snap-rounding-update-system";
const APP_PART_RENDER_SYSTEM_ID = "snap-rounding-render-system";

function snapRoundingStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputParameter = new RangeInputElement("parameter", "1", "200", "50");
    inputParameter.setStyle("width: 200px");
    inputElements.push(inputParameter);

    world.setData<SnapRoundingInputData>({
        dataId: "snap-rounding-input-data",
        inputParameter,
    });

    world.setData<SnapRoundingStateData>({
        dataId: "snap-rounding-state-data",
        inputSegments: [],
        outputSegments: [],
        intersections: [],
        magnets: [],
        pins: [],
        errors: [],
    });
}

function snapRoundingUpdateSystem(world: World): void {
    const { inputParameter } = world.getData<SnapRoundingInputData>("snap-rounding-input-data");
    const parameter = inputParameter.getInt();

    const { generatorTextBox, seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();
    const generator = generatorTextBox.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

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

    world.setData<SnapRoundingStateData>({
        dataId: "snap-rounding-state-data",
        inputSegments,
        outputSegments,
        intersections,
        magnets,
        pins,
        errors,
    });
}

function snapRoundingRenderSystem(world: World): void {
    const { errors, inputSegments, intersections, magnets, outputSegments, pins } =
        world.getData<SnapRoundingStateData>("snap-rounding-state-data");
    const { inputParameter } = world.getData<SnapRoundingInputData>("snap-rounding-input-data");
    const parameter = inputParameter.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
    ctx.fillBoxes(magnets, "#E4E4E4");
    ctx.drawEdges(inputSegments, "#888888");
    ctx.fillPoints(pins, "#CCCCCC", 0.25 * parameter);
    ctx.fillBoxes(errors, "#0088FF44");
    ctx.drawEdges(outputSegments);
    ctx.fillEdgePoints(outputSegments, "#000000", 5);
    ctx.fillPoints(intersections, "#FF0000", 5);
}

function addEdge(snapRound: SnapRound2, p0: ReadonlyVector2, p1: ReadonlyVector2, snap = false): void {
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
                let p0 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
                let p1 = new Vector2(width * random.nextFloat(), height * random.nextFloat());

                if (random.nextFloat() < pinProbability) {
                    p0 = p0.roundToPrecision(k);
                }

                if (random.nextFloat() < pinProbability) {
                    p1 = p1.roundToPrecision(k);
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
            const p0 = new Vector2(width * random.nextFloat(), height * random.nextFloat());
            const p1 = new Vector2(width * random.nextFloat(), height * random.nextFloat());

            const t0 = random.nextFloatBetween(0, 0.5);
            const t1 = random.nextFloatBetween(0.5, 1);

            const pp0 = p0.lerp(p1, t0).roundToPrecision(k);
            const pp1 = p0.lerp(p1, t1).roundToPrecision(k);

            addEdge(snapRound, p0, p1);
            addEdge(snapRound, pp0, pp1, true);

            break;
        }
    }
}

function transformBox(points: ReadonlyVector2[], scale: number): MinMaxBox2[] {
    const result: MinMaxBox2[] = [];

    for (const point of points) {
        const x = Math.round(scale * (point.x - 0.5));
        const y = Math.round(scale * (point.y - 0.5));
        const d = Math.round(scale);
        result.push(new MinMaxBox2(x, y, x + d, y + d));
    }

    return result;
}

function transformPoints(points: ReadonlyVector2[], scale: number): Vector2[] {
    const result: Vector2[] = [];

    for (const point of points) {
        const x0 = Math.round(scale * point.x);
        const y0 = Math.round(scale * point.y);
        result.push(new Vector2(x0, y0));
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

export function snapRoundingAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<SnapRoundingInputData>("snap-rounding-input-data");
    context.addData<SnapRoundingStateData>("snap-rounding-state-data");

    context.addSystem({
        id: APP_PART_START_SYSTEM_ID,
        fn: snapRoundingStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: APP_PART_UPDATE_SYSTEM_ID,
        fn: snapRoundingUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: APP_PART_RENDER_SYSTEM_ID,
        fn: snapRoundingRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, APP_PART_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, APP_PART_UPDATE_SYSTEM_ID, APP_PART_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}

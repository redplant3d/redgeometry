import { Polygon2 } from "redgeometry/src/core/polygon";
import { MinMaxBox2 } from "redgeometry/src/primitives/box";
import { Matrix3A } from "redgeometry/src/primitives/matrix";
import type { Vector2 } from "redgeometry/src/primitives/vector";
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
import { createRandomPolygonSimple } from "../utility/helper.ts";
import { RangeInputElement } from "../utility/html-element.ts";

type PolygonMinkowskiInputData = {
    dataId: "polygon-minkowski-input-data";
    inputParameterA: RangeInputElement;
    inputParameterB: RangeInputElement;
};

type PolygonMinkowskiStateData = {
    dataId: "polygon-minkowski-state-data";
    polygonA: Polygon2;
    polygonB: Polygon2;
    polygonC: Polygon2;
};

const APP_PART_START_SYSTEM_ID = "polygon-minkowski-start-system";
const APP_PART_UPDATE_SYSTEM_ID = "polygon-minkowski-update-system";
const APP_PART_RENDER_SYSTEM_ID = "polygon-minkowski-render-system";

function polygonMinkowskiStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputParameterA = new RangeInputElement("countA", "3", "20", "5");
    inputParameterA.setStyle("width: 200px");
    inputElements.push(inputParameterA);

    const inputParameterB = new RangeInputElement("countB", "3", "20", "5");
    inputParameterB.setStyle("width: 200px");
    inputElements.push(inputParameterB);

    world.setData<PolygonMinkowskiInputData>({
        dataId: "polygon-minkowski-input-data",
        inputParameterA,
        inputParameterB,
    });

    world.setData<PolygonMinkowskiStateData>({
        dataId: "polygon-minkowski-state-data",
        polygonA: Polygon2.createEmpty(),
        polygonB: Polygon2.createEmpty(),
        polygonC: Polygon2.createEmpty(),
    });
}

function polygonMinkowskiUpdateSystem(world: World): void {
    const { inputParameterA, inputParameterB } =
        world.getData<PolygonMinkowskiInputData>("polygon-minkowski-input-data");
    const parameterA = inputParameterA.getInt();
    const parameterB = inputParameterB.getInt();

    const { seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();

    const random = RandomXSR128.fromSeedLcg(seed);

    const boxA = new MinMaxBox2(-50, -50, 50, 50);
    const boxB = new MinMaxBox2(-50, -50, 50, 50);

    const polygonA = createRandomPolygonSimple(random, boxA, parameterA, 0.5, 1);
    const polygonB = createRandomPolygonSimple(random, boxB, parameterB, 0.5, 1);

    const points: Vector2[] = [];

    for (const pa of polygonA.points) {
        for (const pb of polygonB.points) {
            const p = pa.add(pb);
            points.push(p);
        }
    }

    const polygonC = Polygon2.createConvexHull(points);

    world.setData<PolygonMinkowskiStateData>({
        dataId: "polygon-minkowski-state-data",
        polygonA,
        polygonB,
        polygonC,
    });
}

function polygonMinkowskiRenderSystem(world: World): void {
    const { polygonA, polygonB, polygonC } = world.getData<PolygonMinkowskiStateData>("polygon-minkowski-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();

    const mat = Matrix3A.fromTranslation(150, 150);
    ctx.setTransform(mat);
    ctx.fillPolygon(polygonA, "#FF0000");

    mat.setFromTranslation(350, 150);
    ctx.setTransform(mat);
    ctx.fillPolygon(polygonB, "#00FF00");

    mat.setFromTranslation(600, 150);
    ctx.setTransform(mat);
    ctx.fillPolygon(polygonC, "#0000FF");
}

export function polygonMinkowskiAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<PolygonMinkowskiInputData>("polygon-minkowski-input-data");
    context.addData<PolygonMinkowskiStateData>("polygon-minkowski-state-data");

    context.addSystem({
        id: APP_PART_START_SYSTEM_ID,
        fn: polygonMinkowskiStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: APP_PART_UPDATE_SYSTEM_ID,
        fn: polygonMinkowskiUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: APP_PART_RENDER_SYSTEM_ID,
        fn: polygonMinkowskiRenderSystem,
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

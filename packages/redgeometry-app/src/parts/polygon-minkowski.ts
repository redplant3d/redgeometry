import { Polygon2 } from "redgeometry/src/core/polygon";
import { MinMaxBox2 } from "redgeometry/src/primitives/box";
import { Matrix3A } from "redgeometry/src/primitives/matrix";
import type { Vector2 } from "redgeometry/src/primitives/vector";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { RangeInputElement, type AppInputData } from "../ecs-modules/app-input.ts";
import { type AppStateData } from "../ecs-modules/app.ts";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import { type World } from "../ecs/world.ts";
import { createRandomPolygonSimple } from "../utility/helper.ts";

type AppPartMainData = {
    dataId: "app-part-main-data";
    inputParameterA: RangeInputElement;
    inputParameterB: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote-data";
    polygonA: Polygon2;
    polygonB: Polygon2;
    polygonC: Polygon2;
};

type AppPartStateData = {
    dataId: "app-part-state-data";
    parameterA: number;
    parameterB: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input-data");

    const inputParameterA = new RangeInputElement("countA", "3", "20", "5");
    inputParameterA.setStyle("width: 200px");
    inputElements.push(inputParameterA);

    const inputParameterB = new RangeInputElement("countB", "3", "20", "5");
    inputParameterB.setStyle("width: 200px");
    inputElements.push(inputParameterB);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main-data",
        inputParameterA,
        inputParameterB,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        polygonA: Polygon2.createEmpty(),
        polygonB: Polygon2.createEmpty(),
        polygonC: Polygon2.createEmpty(),
    });
}

function writeStateSystem(world: World): void {
    const { inputParameterA, inputParameterB } = world.readData<AppPartMainData>("app-part-main-data");

    const stateData: AppPartStateData = {
        dataId: "app-part-state-data",
        parameterA: inputParameterA.getInt(),
        parameterB: inputParameterB.getInt(),
    };

    world.writeData(stateData);
}

function updateSystem(world: World): void {
    const { parameterA, parameterB } = world.readData<AppPartStateData>("app-part-state-data");
    const { seed } = world.readData<AppStateData>("app-state-data");

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

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        polygonA,
        polygonB,
        polygonC,
    });
}

function renderSystem(world: World): void {
    const { polygonA, polygonB, polygonC } = world.readData<AppPartRemoteData>("app-part-remote-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

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

export class PolygonMinkowskiAppPartModule implements WorldModule {
    public readonly moduleId = "app-part-main-data";

    public setup(world: World): void {
        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

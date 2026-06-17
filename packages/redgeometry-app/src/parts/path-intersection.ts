import { Path2 } from "redgeometry/src/core/path";
import { Bezier2Curve2 } from "redgeometry/src/primitives/bezier";
import { Vector2, type ReadonlyVector2 } from "redgeometry/src/primitives/vector";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { RangeInputElement, type AppInputData } from "../ecs-modules/app-input.ts";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import { type World } from "../ecs/world.ts";

type AppPartMainData = {
    dataId: "app-part-main-data";
    inputParameter: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote-data";
    path: Path2;
    points: ReadonlyVector2[];
};

type AppPartStateData = {
    dataId: "app-part-state-data";
    parameter: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input-data");

    const inputParameter = new RangeInputElement("parameter", "0", "200", "100");
    inputParameter.setStyle("width: 200px");
    inputElements.push(inputParameter);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main-data",
        inputParameter,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        path: Path2.createEmpty(),
        points: [],
    });
}

function writeStateSystem(world: World): void {
    const { inputParameter } = world.readData<AppPartMainData>("app-part-main-data");

    const stateData: AppPartStateData = {
        dataId: "app-part-state-data",
        parameter: inputParameter.getInt(),
    };

    world.writeData(stateData);
}

function updateSystem(world: World): void {
    const { parameter } = world.readData<AppPartStateData>("app-part-state-data");

    const c1 = new Bezier2Curve2(new Vector2(100, 150), new Vector2(300, 400), new Vector2(600, 250));
    const c2 = new Bezier2Curve2(new Vector2(100, 500), new Vector2(300, 100), new Vector2(500, 100 + 3 * parameter));

    const points: Vector2[] = [];
    const path = Path2.createEmpty();

    c1.intersectQuad(c2, points);

    path.addCurveSplines(c1);
    path.addCurveSplines(c2);

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        path,
        points,
    });
}

function renderSystem(world: World): void {
    const { path, points } = world.readData<AppPartRemoteData>("app-part-remote-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.drawPath(path);
    ctx.fillPoints(points, "#FF0000", 5);
}

export class PathIntersectionAppPartModule implements WorldModule {
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

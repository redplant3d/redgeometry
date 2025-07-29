import { Path2 } from "redgeometry/src/core/path";
import { Bezier2Curve2 } from "redgeometry/src/primitives/bezier";
import { Vector2, type ReadonlyVector2 } from "redgeometry/src/primitives/vector";
import type { AppContextPlugin } from "../ecs-modules/app-context.js";
import { AppContextModule } from "../ecs-modules/app-context.js";
import type { AppInputData } from "../ecs-modules/app-input.js";
import { RangeInputElement } from "../ecs-modules/app-input.js";
import { AppMainModule, AppRemoteModule } from "../ecs-modules/app.js";
import type { WorldOptions } from "../ecs/app.js";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.js";
import { WORLD_SCHEDULE_OPTIONS_DEFAULT, type World } from "../ecs/world.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputParameter: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    path: Path2;
    points: ReadonlyVector2[];
};

type AppPartStateData = {
    dataId: "app-part-state";
    parameter: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputParameter = new RangeInputElement("parameter", "0", "200", "100");
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
        path: Path2.createEmpty(),
        points: [],
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

    const c1 = new Bezier2Curve2(new Vector2(100, 150), new Vector2(300, 400), new Vector2(600, 250));
    const c2 = new Bezier2Curve2(new Vector2(100, 500), new Vector2(300, 100), new Vector2(500, 100 + 3 * parameter));

    const points: Vector2[] = [];
    const path = Path2.createEmpty();

    c1.intersectQuad(c2, points);

    path.addCurveSplines(c1);
    path.addCurveSplines(c2);

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        path,
        points,
    });
}

function renderSystem(world: World): void {
    const { path, points } = world.readData<AppPartRemoteData>("app-part-remote");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.drawPath(path);
    ctx.fillPoints(points, "#FF0000", 5);
}

class AppPartMainModule implements WorldModule {
    public readonly moduleId = "app-part-main";

    public setup(world: World): void {
        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });
    }
}

class AppPartRemoteModule implements WorldModule {
    public readonly moduleId = "app-part-remote";

    public setup(world: World): void {
        world.addModules([new AppContextModule()]);

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

export const PATH_INTERSECTION_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: WORLD_SCHEDULE_OPTIONS_DEFAULT,
};

export const PATH_INTERSECTION_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: WORLD_SCHEDULE_OPTIONS_DEFAULT,
};

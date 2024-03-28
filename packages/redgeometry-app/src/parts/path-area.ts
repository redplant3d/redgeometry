import { Path2 } from "redgeometry/src/core/path";
import { WindingOperator } from "redgeometry/src/core/path-options";
import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { Box2 } from "redgeometry/src/primitives/box";
import { Point2 } from "redgeometry/src/primitives/point";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs/app-context.js";
import { AppContextModule } from "../ecs/app-context.js";
import type { AppInputData } from "../ecs/app-input.js";
import { TextBoxInputElement } from "../ecs/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs/app.js";
import type { MousePlugin } from "../ecs/input.js";
import { createRandomPath } from "../utility/helper.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputCount: TextBoxInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    bounds: Box2;
    input: Path2;
    isInside: boolean;
};

type AppPartStateData = {
    dataId: "app-part-state";
    count: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputCount = new TextBoxInputElement("count", "100");
    inputCount.setStyle("width: 80px");
    inputElements.push(inputCount);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputCount,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        bounds: Box2.createEmpty(),
        input: Path2.createEmpty(),
        isInside: false,
    });
}

function writeStateSystem(world: World): void {
    const { inputCount: countTextBox } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        count: countTextBox.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { count } = world.readData<AppPartStateData>("app-part-state");
    const { seed, generator } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");
    const mouse = world.getPlugin<MousePlugin>("mouse");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);

    const path = createRandomPath(random, generator, count, canvasWidth, canvasHeight);
    path.close();

    const p = Point2.fromObject(mouse.getCursorPosition());

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        input: path,
        bounds: path.getBounds(),
        isInside: path.hasPointInside(p, WindingOperator.EvenOdd),
    });

    // log.info("Path area = {}", path.getSignedArea());
}

function renderSystem(world: World): void {
    const { bounds, input, isInside } = world.readData<AppPartRemoteData>("app-part-remote");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.fillBox(bounds, "#ADD8E644");
    ctx.fillPath(input, isInside ? "#FFCCCC" : "#CCCCCC", "evenodd");
    ctx.drawPath(input, "#666666");
    ctx.fillPoints(input.getPoints(), "#000000", 5);
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

export const PATH_AREA_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const PATH_AREA_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

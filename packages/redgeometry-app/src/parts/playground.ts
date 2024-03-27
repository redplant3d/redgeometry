import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs/app-context.js";
import { AppContextModule } from "../ecs/app-context.js";
import type { AppInputData } from "../ecs/app-input.js";
import { RangeInputElement } from "../ecs/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs/app.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputParam1: RangeInputElement;
    inputParam2: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
};

type AppPartStateData = {
    dataId: "app-part-state";
    param1: number;
    param2: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputParam1 = new RangeInputElement("param1", "1", "100", "50");
    inputParam1.setStyle("width: 200px");
    inputElements.push(inputParam1);

    const inputParam2 = new RangeInputElement("param2", "1", "100", "50");
    inputParam2.setStyle("width: 200px");
    inputElements.push(inputParam2);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputParam1,
        inputParam2,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
    });
}

function writeStateSystem(world: World): void {
    const { inputParam1, inputParam2 } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        param1: inputParam1.getInt(),
        param2: inputParam2.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { param1, param2 } = world.readData<AppPartStateData>("app-part-state");
    const { seed } = world.readData<AppStateData>("app-state");

    const random = RandomXSR128.fromSeedLcg(seed);

    log.infoDebug("param1 = {}, param2 = {}, random = {}", param1, param2, random.nextInt());

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
    });
}

function renderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
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

export const PLAYGROUND_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const PLAYGROUND_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

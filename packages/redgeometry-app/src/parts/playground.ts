import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { RangeInputElement, type AppInputData } from "../ecs-modules/app-input.ts";
import { type AppStateData } from "../ecs-modules/app.ts";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import { type World } from "../ecs/world.ts";

type AppPartMainData = {
    dataId: "app-part-main-data";
    inputParam1: RangeInputElement;
    inputParam2: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote-data";
};

type AppPartStateData = {
    dataId: "app-part-state-data";
    param1: number;
    param2: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input-data");

    const inputParam1 = new RangeInputElement("param1", "1", "100", "50");
    inputParam1.setStyle("width: 200px");
    inputElements.push(inputParam1);

    const inputParam2 = new RangeInputElement("param2", "1", "100", "50");
    inputParam2.setStyle("width: 200px");
    inputElements.push(inputParam2);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main-data",
        inputParam1,
        inputParam2,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
    });
}

function writeStateSystem(world: World): void {
    const { inputParam1, inputParam2 } = world.readData<AppPartMainData>("app-part-main-data");

    const stateData: AppPartStateData = {
        dataId: "app-part-state-data",
        param1: inputParam1.getInt(),
        param2: inputParam2.getInt(),
    };

    world.writeData(stateData);
}

function updateSystem(world: World): void {
    const { param1, param2 } = world.readData<AppPartStateData>("app-part-state-data");
    const { seed } = world.readData<AppStateData>("app-state-data");

    const random = RandomXSR128.fromSeedLcg(seed);

    log.infoDebug("param1 = {}, param2 = {}, random = {}", param1, param2, random.nextInt());

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
    });
}

function renderSystem(world: World): void {
    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
}

export class PlaygroundAppPartModule implements WorldModule {
    public readonly moduleId = "playground-app-part-module";

    public setup(world: World): void {
        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

import { ColorRgba } from "redgeometry/src/primitives/color";
import { FillRule, SoftwareRenderContext2 } from "redgeometry/src/render/context";
import { Image2 } from "redgeometry/src/render/image";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.js";
import { AppContextModule } from "../ecs-modules/app-context.js";
import type { AppInputData } from "../ecs-modules/app-input.js";
import { RangeInputElement, TextBoxInputElement } from "../ecs-modules/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs-modules/app.js";
import type { WorldOptions } from "../ecs/app.js";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.js";
import { DEFAULT_WORLD_SCHEDULES, type World } from "../ecs/world.js";
import { createRandomPath } from "../utility/helper.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputCount: TextBoxInputElement;
    inputSize: RangeInputElement;
    inputColor: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    image: Image2;
};

type AppPartStateData = {
    dataId: "app-part-state";
    count: number;
    size: number;
    color: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputCount = new TextBoxInputElement("count", "10");
    inputCount.setStyle("width: 80px");
    inputElements.push(inputCount);

    const inputSize = new RangeInputElement("size", "1", "1024", "200");
    inputSize.setStyle("width: 200px");
    inputElements.push(inputSize);

    const inputColor = new RangeInputElement("color", "0", "255", "128");
    inputColor.setStyle("width: 200px");
    inputElements.push(inputColor);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputCount,
        inputSize,
        inputColor,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        image: new Image2(0, 0),
    });
}

function writeStateSystem(world: World): void {
    const { inputCount, inputSize, inputColor } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        count: inputCount.getInt(),
        size: inputSize.getInt(),
        color: inputColor.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { image } = world.readData<AppPartRemoteData>("app-part-remote");
    const { count, size, color } = world.readData<AppPartStateData>("app-part-state");
    const { seed, generator } = world.readData<AppStateData>("app-state");

    const random = RandomXSR128.fromSeedLcg(seed);

    const path = createRandomPath(random, generator, count, size, size);
    path.close();

    image.resize(size, size);

    const ctx = new SoftwareRenderContext2();
    ctx.begin(image);
    ctx.fillRule = FillRule.EvenOdd;

    ctx.fillColor = new ColorRgba(224, 224, 224, 255);
    ctx.clear();

    ctx.fillColor = new ColorRgba(color, 0, 0, 255);
    ctx.fillPath(path);
}

function renderSystem(world: World): void {
    const { image } = world.readData<AppPartRemoteData>("app-part-remote");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.blitImage(image, 0, 0);
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

export const IMAGE_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const IMAGE_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

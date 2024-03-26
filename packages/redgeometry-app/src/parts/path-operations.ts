import { Path2 } from "redgeometry/src/core/path";
import { ROUND_CAPS } from "redgeometry/src/core/path-options";
import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs/app-context.js";
import { AppContextModule } from "../ecs/app-context.js";
import { AppMainModule, AppRemoteModule, type AppMainData, type AppStateData } from "../ecs/app.js";
import { createPath, getJoin } from "../utility/helper.js";
import { ComboBoxInputElement, RangeInputElement, TextBoxInputElement } from "../utility/input.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputCount: TextBoxInputElement;
    inputJoin: ComboBoxInputElement;
    inputOp: ComboBoxInputElement;
    inputParam1: RangeInputElement;
    inputParam2: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    input: Path2;
    output: Path2;
};

type AppPartStateData = {
    dataId: "app-part-state";
    count: number;
    op: string;
    param1: number;
    param2: number;
    join: string;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppMainData>("app-main");

    const inputCount = new TextBoxInputElement("count", "10");
    inputCount.setStyle("width: 80px");
    inputElements.push(inputCount);

    const inputOp = new ComboBoxInputElement("op", "flatten");
    inputOp.setOptionValues("flatten", "simplify", "offset", "dash", "stroke", "dashstroke");
    inputElements.push(inputOp);

    const inputParam1 = new RangeInputElement("param1", "0", "100", "50");
    inputParam1.setStyle("width: 200px");
    inputElements.push(inputParam1);

    const inputParam2 = new RangeInputElement("param2", "0", "100", "50");
    inputParam2.setStyle("width: 200px");
    inputElements.push(inputParam2);

    const inputJoin = new ComboBoxInputElement("join", "bevel");
    inputJoin.setOptionValues("bevel", "miter", "miterclip", "round");
    inputElements.push(inputJoin);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputCount,
        inputOp,
        inputParam1,
        inputParam2,
        inputJoin,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        input: Path2.createEmpty(),
        output: Path2.createEmpty(),
    });
}

function writeStateSystem(world: World): void {
    const { inputCount, inputOp, inputParam1, inputParam2, inputJoin } =
        world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        count: inputCount.getInt(),
        op: inputOp.getValue(),
        param1: inputParam1.getInt(),
        param2: inputParam2.getInt(),
        join: inputJoin.getValue(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { count, op, param1, param2, join } = world.readData<AppPartStateData>("app-part-state");
    const { seed, generator } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);

    const path = createPath(random, generator, count, canvasWidth, canvasHeight);
    // path.close();

    let output: Path2 | undefined;

    switch (op) {
        case "flatten": {
            output = path.flatten(false, {
                flattenTolerance: (10 * param2 + 1) / 10,
                simplifyTolerance: (10 * param1 + 1) / 10,
            });
            break;
        }
        case "simplify": {
            output = path.simplify({
                simplifyTolerance: (10 * param1 + 1) / 10,
            });
            break;
        }
        case "offset": {
            output = path.offset({
                distance: param1 - 50,
                join: getJoin(join),
                miterLimit: param2 / 10,
            });
            break;
        }
        case "dash": {
            output = path.dash({
                array: [2 * param1, param1],
                offset: 10 * param2,
            });
            break;
        }
        case "stroke": {
            output = path.stroke({
                caps: ROUND_CAPS,
                join: getJoin(join),
                miterLimit: param2 / 10,
                width: param1,
            });
            break;
        }
        case "dashstroke": {
            output = path.stroke({
                caps: ROUND_CAPS,
                dashArray: [2 * param1, param1],
                dashOffset: 10 * param2,
                join: getJoin(join),
                width: 50,
            });
            break;
        }
        default: {
            output = Path2.createEmpty();
        }
    }

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        input: path,
        output,
    });
}

function renderSystem(world: World): void {
    const { input, output } = world.readData<AppPartRemoteData>("app-part-remote");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.drawPath(input, "#666666FF", 1);
    ctx.drawPath(output, "#FF0000FF", 2);
    ctx.fillPoints(input.getPoints(), "#00000088", 5);
    ctx.fillPoints(output.getPoints(), "#FF000088", 5);
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

export const PATH_OPERATIONS_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const PATH_OPERATIONS_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

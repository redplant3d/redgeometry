import { Path2 } from "redgeometry/src/core/path";
import { ROUND_CAPS } from "redgeometry/src/core/path-options";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import {
    ComboBoxInputElement,
    RangeInputElement,
    TextBoxInputElement,
    type AppInputData,
} from "../ecs-modules/app-input.ts";
import { type AppStateData } from "../ecs-modules/app.ts";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import { type World } from "../ecs/world.ts";
import { createRandomPath, getJoinType } from "../utility/helper.ts";

type AppPartMainData = {
    dataId: "app-part-main-data";
    inputCount: TextBoxInputElement;
    inputJoin: ComboBoxInputElement;
    inputOp: ComboBoxInputElement;
    inputParam1: RangeInputElement;
    inputParam2: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote-data";
    input: Path2;
    output: Path2;
};

type AppPartStateData = {
    dataId: "app-part-state-data";
    count: number;
    op: string;
    param1: number;
    param2: number;
    join: string;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input-data");

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
        dataId: "app-part-main-data",
        inputCount,
        inputOp,
        inputParam1,
        inputParam2,
        inputJoin,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        input: Path2.createEmpty(),
        output: Path2.createEmpty(),
    });
}

function writeStateSystem(world: World): void {
    const { inputCount, inputOp, inputParam1, inputParam2, inputJoin } =
        world.readData<AppPartMainData>("app-part-main-data");

    const stateData: AppPartStateData = {
        dataId: "app-part-state-data",
        count: inputCount.getInt(),
        op: inputOp.getValue(),
        param1: inputParam1.getInt(),
        param2: inputParam2.getInt(),
        join: inputJoin.getValue(),
    };

    world.writeData(stateData);
}

function updateSystem(world: World): void {
    const { count, op, param1, param2, join } = world.readData<AppPartStateData>("app-part-state-data");
    const { seed, generator } = world.readData<AppStateData>("app-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);

    const path = createRandomPath(random, generator, count, canvasWidth, canvasHeight);
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
                join: getJoinType(join),
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
                join: getJoinType(join),
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
                join: getJoinType(join),
                width: 50,
            });
            break;
        }
        default: {
            output = Path2.createEmpty();
        }
    }

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        input: path,
        output,
    });
}

function renderSystem(world: World): void {
    const { input, output } = world.readData<AppPartRemoteData>("app-part-remote-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.drawPath(input, "#666666FF", 1);
    ctx.drawPath(output, "#FF0000FF", 2);
    ctx.fillPoints(input.getPoints(), "#00000088", 5);
    ctx.fillPoints(output.getPoints(), "#FF000088", 5);
}

export class PathOperationAppPartModule implements WorldModule {
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

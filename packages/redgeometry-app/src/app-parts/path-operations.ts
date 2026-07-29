import { Path2 } from "redgeometry/src/core/path";
import { ROUND_CAPS } from "redgeometry/src/core/path-options";
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
import { createRandomPath, getJoinType } from "../utility/helper.ts";
import { ComboBoxInputElement, RangeInputElement, TextBoxInputElement } from "../utility/html-element.ts";

type PathOperationInputData = {
    dataId: "path-operation-input-data";
    inputCount: TextBoxInputElement;
    inputJoin: ComboBoxInputElement;
    inputOp: ComboBoxInputElement;
    inputParam1: RangeInputElement;
    inputParam2: RangeInputElement;
};

type PathOperationStateData = {
    dataId: "path-operation-state-data";
    input: Path2;
    output: Path2;
};

const APP_PART_START_SYSTEM_ID = "path-operation-start-system";
const APP_PART_UPDATE_SYSTEM_ID = "path-operation-update-system";
const APP_PART_RENDER_SYSTEM_ID = "path-operation-render-system";

function pathOperationStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

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

    world.setData<PathOperationInputData>({
        dataId: "path-operation-input-data",
        inputCount,
        inputOp,
        inputParam1,
        inputParam2,
        inputJoin,
    });

    world.setData<PathOperationStateData>({
        dataId: "path-operation-state-data",
        input: Path2.createEmpty(),
        output: Path2.createEmpty(),
    });
}

function pathOperationUpdateSystem(world: World): void {
    const { inputCount, inputOp, inputParam1, inputParam2, inputJoin } =
        world.getData<PathOperationInputData>("path-operation-input-data");
    const count = inputCount.getInt();
    const op = inputOp.getValue();
    const param1 = inputParam1.getInt();
    const param2 = inputParam2.getInt();
    const join = inputJoin.getValue();

    const { generatorTextBox, seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();
    const generator = generatorTextBox.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

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

    world.setData<PathOperationStateData>({
        dataId: "path-operation-state-data",
        input: path,
        output,
    });
}

function pathOperationRenderSystem(world: World): void {
    const { input, output } = world.getData<PathOperationStateData>("path-operation-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
    ctx.drawPath(input, "#666666FF", 1);
    ctx.drawPath(output, "#FF0000FF", 2);
    ctx.fillPoints(input.getPoints(), "#00000088", 5);
    ctx.fillPoints(output.getPoints(), "#FF000088", 5);
}

export function pathOperationAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<PathOperationInputData>("path-operation-input-data");
    context.addData<PathOperationStateData>("path-operation-state-data");

    context.addSystem({
        id: APP_PART_START_SYSTEM_ID,
        fn: pathOperationStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: APP_PART_UPDATE_SYSTEM_ID,
        fn: pathOperationUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: APP_PART_RENDER_SYSTEM_ID,
        fn: pathOperationRenderSystem,
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

import { Path2 } from "redgeometry/src/core/path";
import { WindingOperator } from "redgeometry/src/core/winding";
import { MinMaxBox2, type ReadonlyMinMaxBox2 } from "redgeometry/src/primitives/box";
import { Vector2 } from "redgeometry/src/primitives/vector";
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
import type { MousePlugin } from "../ecs-modules/input.ts";
import { WorldContext, type World } from "../ecs/world.ts";
import { createRandomPath } from "../utility/helper.ts";
import { TextBoxInputElement } from "../utility/html-element.ts";

type PathAreaInputData = {
    dataId: "path-area-input-data";
    inputCount: TextBoxInputElement;
};

type PathAreaStateData = {
    dataId: "path-area-state-data";
    bounds: ReadonlyMinMaxBox2;
    input: Path2;
    isInside: boolean;
};

const PATH_AREA_START_SYSTEM_ID = "path-area-start-system";
const PATH_AREA_UPDATE_SYSTEM_ID = "path-area-update-system";
const PATH_AREA_RENDER_SYSTEM_ID = "path-area-render-system";

function pathAreaStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputCount = new TextBoxInputElement("count", "100");
    inputCount.setStyle("width: 80px");
    inputElements.push(inputCount);

    world.setData<PathAreaInputData>({
        dataId: "path-area-input-data",
        inputCount,
    });

    world.setData<PathAreaStateData>({
        dataId: "path-area-state-data",
        bounds: MinMaxBox2.createEmpty(),
        input: Path2.createEmpty(),
        isInside: false,
    });
}

function pathAreaUpdateSystem(world: World): void {
    const { inputCount } = world.getData<PathAreaInputData>("path-area-input-data");
    const count = inputCount.getInt();

    const { generatorTextBox, seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();
    const generator = generatorTextBox.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");
    const mouse = world.getPlugin<MousePlugin>("mouse-plugin");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);

    const path = createRandomPath(random, generator, count, canvasWidth, canvasHeight);
    path.close();

    const p = Vector2.fromObject(mouse.getCursorPosition());

    world.setData<PathAreaStateData>({
        dataId: "path-area-state-data",
        input: path,
        bounds: path.bounds(),
        isInside: path.hasPointInside(p, WindingOperator.EVEN_ODD),
    });

    // log.info("Path area = {}", path.signedArea());
}

function pathAreaRenderSystem(world: World): void {
    const { bounds, input, isInside } = world.getData<PathAreaStateData>("path-area-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
    ctx.fillBox(bounds, "#ADD8E644");
    ctx.fillPath(input, isInside ? "#FFCCCC" : "#CCCCCC", "evenodd");
    ctx.drawPath(input, "#666666");
    ctx.fillPoints(input.getPoints(), "#000000", 5);
}

export const PATH_AREA_APP_PART_MODULE_ID = "path-area-app-part-module";

export function pathAreaAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<PathAreaInputData>("path-area-input-data");
    context.addData<PathAreaStateData>("path-area-state-data");

    context.addSystem({
        id: PATH_AREA_START_SYSTEM_ID,
        fn: pathAreaStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: PATH_AREA_UPDATE_SYSTEM_ID,
        fn: pathAreaUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: PATH_AREA_RENDER_SYSTEM_ID,
        fn: pathAreaRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, PATH_AREA_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, PATH_AREA_UPDATE_SYSTEM_ID, PATH_AREA_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}

import { Path2 } from "redgeometry/src/core/path";
import { WindingOperator } from "redgeometry/src/core/winding";
import { MinMaxBox2, type ReadonlyMinMaxBox2 } from "redgeometry/src/primitives/box";
import { Vector2 } from "redgeometry/src/primitives/vector";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { TextBoxInputElement, type AppInputData } from "../ecs-modules/app-input.ts";
import { type AppStateData } from "../ecs-modules/app.ts";
import type { MousePlugin } from "../ecs-modules/input.ts";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import { type World } from "../ecs/world.ts";
import { createRandomPath } from "../utility/helper.ts";

type AppPartMainData = {
    dataId: "app-part-main-data";
    inputCount: TextBoxInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote-data";
    bounds: ReadonlyMinMaxBox2;
    input: Path2;
    isInside: boolean;
};

type AppPartStateData = {
    dataId: "app-part-state-data";
    count: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input-data");

    const inputCount = new TextBoxInputElement("count", "100");
    inputCount.setStyle("width: 80px");
    inputElements.push(inputCount);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main-data",
        inputCount,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        bounds: MinMaxBox2.createEmpty(),
        input: Path2.createEmpty(),
        isInside: false,
    });
}

function writeStateSystem(world: World): void {
    const { inputCount: countTextBox } = world.readData<AppPartMainData>("app-part-main-data");

    const stateData: AppPartStateData = {
        dataId: "app-part-state-data",
        count: countTextBox.getInt(),
    };

    world.writeData(stateData);
}

function updateSystem(world: World): void {
    const { count } = world.readData<AppPartStateData>("app-part-state-data");
    const { seed, generator } = world.readData<AppStateData>("app-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");
    const mouse = world.getPlugin<MousePlugin>("mouse");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);

    const path = createRandomPath(random, generator, count, canvasWidth, canvasHeight);
    path.close();

    const p = Vector2.fromObject(mouse.getCursorPosition());

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        input: path,
        bounds: path.bounds(),
        isInside: path.hasPointInside(p, WindingOperator.EVEN_ODD),
    });

    // log.info("Path area = {}", path.signedArea());
}

function renderSystem(world: World): void {
    const { bounds, input, isInside } = world.readData<AppPartRemoteData>("app-part-remote-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.fillBox(bounds, "#ADD8E644");
    ctx.fillPath(input, isInside ? "#FFCCCC" : "#CCCCCC", "evenodd");
    ctx.drawPath(input, "#666666");
    ctx.fillPoints(input.getPoints(), "#000000", 5);
}

export class PathAreaAppPartModule implements WorldModule {
    public readonly moduleId = "path-area-app-part-module";

    public setup(world: World): void {
        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

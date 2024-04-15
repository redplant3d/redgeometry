import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { DEFAULT_PATH_QUALITY_OPTIONS } from "redgeometry/src/core/path-options";
import { Polygon2 } from "redgeometry/src/primitives/polygon";
import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.js";
import { AppContextModule } from "../ecs-modules/app-context.js";
import type { AppInputData } from "../ecs-modules/app-input.js";
import { ComboBoxInputElement, RangeInputElement } from "../ecs-modules/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs-modules/app.js";
import type { WorldOptions } from "../ecs/app.js";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.js";
import { DEFAULT_WORLD_SCHEDULES, type World } from "../ecs/world.js";
import { createRandomPolygonPair, getBooleanOperator, getWindingOperator } from "../utility/helper.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputBoolOp: ComboBoxInputElement;
    inputOptions: ComboBoxInputElement;
    inputParameter: RangeInputElement;
    inputWindA: ComboBoxInputElement;
    inputWindB: ComboBoxInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    error: Path2;
    mesh: Mesh2;
    polygonA: Polygon2;
    polygonB: Polygon2;
};

type AppPartStateData = {
    dataId: "app-part-state";
    parameter: number;
    boolOp: string;
    windA: string;
    windB: string;
    options: string;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputParameter = new RangeInputElement("parameter", "0", "200", "100");
    inputParameter.setStyle("width: 200px");
    inputElements.push(inputParameter);

    const inputBoolOp = new ComboBoxInputElement("boolOp", "union");
    inputBoolOp.setOptionValues("union", "intersection", "exclusion", "awithoutb", "bwithouta");
    inputElements.push(inputBoolOp);

    const inputWindA = new ComboBoxInputElement("windA", "nonzero");
    inputWindA.setOptionValues("nonzero", "evenodd", "positive", "negative", "absgeqtwo");
    inputElements.push(inputWindA);

    const inputWindB = new ComboBoxInputElement("windB", "nonzero");
    inputWindB.setOptionValues("nonzero", "evenodd", "positive", "negative", "absgeqtwo");
    inputElements.push(inputWindB);

    const inputOptions = new ComboBoxInputElement("options", "triangulate");
    inputOptions.setOptionValues("monotonize", "triangulate", "triangulateOpt");
    inputElements.push(inputOptions);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputParameter,
        inputBoolOp,
        inputWindA,
        inputWindB,
        inputOptions,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        polygonA: Polygon2.createEmpty(),
        polygonB: Polygon2.createEmpty(),
        error: Path2.createEmpty(),
        mesh: Mesh2.createEmpty(),
    });
}

function writeStateSystem(world: World): void {
    const { inputParameter, inputBoolOp, inputWindA, inputWindB, inputOptions } =
        world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        parameter: inputParameter.getInt(),
        boolOp: inputBoolOp.getValue(),
        windA: inputWindA.getValue(),
        windB: inputWindB.getValue(),
        options: inputOptions.getValue(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { parameter, boolOp, windA, windB, options } = world.readData<AppPartStateData>("app-part-state");
    const { seed, generator } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const offset = 2 * (parameter - 100);

    const random = RandomXSR128.fromSeedLcg(seed);
    const [width, height] = ctx.getSize(false);

    const [polygonA, polygonB] = createRandomPolygonPair(random, generator, offset, width, height);

    const clip = new PathClip2(DEFAULT_PATH_QUALITY_OPTIONS);

    for (const edge of polygonA.getEdges()) {
        clip.addEdge(edge, 0);
    }

    for (const edge of polygonB.getEdges()) {
        clip.addEdge(edge, 1);
    }

    const mesh = Mesh2.createEmpty();
    clip.process(mesh, {
        booleanOperator: getBooleanOperator(boolOp),
        windingOperatorA: getWindingOperator(windA),
        windingOperatorB: getWindingOperator(windB),
    });

    switch (options) {
        case "monotonize": {
            mesh.monotonize();
            break;
        }
        case "triangulate": {
            mesh.triangulate(false);
            break;
        }
        case "triangulateOpt": {
            mesh.triangulate(true);
            break;
        }
    }

    mesh.validate();

    const error = Path2.createEmpty();

    for (const face of mesh.getFaces()) {
        const orientation = face.getSignedArea();

        if (orientation <= 0) {
            log.warn("Negative path area: {}", orientation);
        }

        if (!face.isMonotoneInX()) {
            face.writeToPath(error);
            log.error("Face not monotone");
        }
    }

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        error,
        mesh,
        polygonA,
        polygonB,
    });
}

function renderSystem(world: World): void {
    const { mesh, error } = world.readData<AppPartRemoteData>("app-part-remote");
    const { seed } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const random = RandomXSR128.fromSeedLcg(seed);

    ctx.clear();
    ctx.fillMeshRandom(mesh, random);

    const pattern = ctx.createLinePattern(10, "#FF0000") ?? "#FF000022";
    ctx.fillPath(error, pattern);

    ctx.drawMeshEdges(mesh, "#AAAAAA", 1.5);
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

export const TRIANGULATE_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const TRIANGULATE_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

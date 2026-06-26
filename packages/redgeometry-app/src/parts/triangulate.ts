import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { PATH_QUALITY_OPTIONS_DEFAULT } from "redgeometry/src/core/path-options";
import { Polygon2 } from "redgeometry/src/core/polygon";
import { log } from "redgeometry/src/internal/log";
import { assert } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { ComboBoxInputElement, RangeInputElement, type AppInputData } from "../ecs-modules/app-input.ts";
import { type AppStateData } from "../ecs-modules/app.ts";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import { type World } from "../ecs/world.ts";
import { createRandomPolygonPair, getBooleanOperator, getWindingOperator } from "../utility/helper.ts";

type AppPartMainData = {
    dataId: "app-part-main-data";
    inputBoolOp: ComboBoxInputElement;
    inputOptions: ComboBoxInputElement;
    inputParameter: RangeInputElement;
    inputWindA: ComboBoxInputElement;
    inputWindB: ComboBoxInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote-data";
    error: Path2;
    mesh: Mesh2;
    polygonA: Polygon2;
    polygonB: Polygon2;
};

type AppPartStateData = {
    dataId: "app-part-state-data";
    parameter: number;
    boolOp: string;
    windA: string;
    windB: string;
    options: string;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input-data");

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
        dataId: "app-part-main-data",
        inputParameter,
        inputBoolOp,
        inputWindA,
        inputWindB,
        inputOptions,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        polygonA: Polygon2.createEmpty(),
        polygonB: Polygon2.createEmpty(),
        error: Path2.createEmpty(),
        mesh: Mesh2.createEmpty(),
    });
}

function writeStateSystem(world: World): void {
    const { inputParameter, inputBoolOp, inputWindA, inputWindB, inputOptions } =
        world.readData<AppPartMainData>("app-part-main-data");

    const stateData: AppPartStateData = {
        dataId: "app-part-state-data",
        parameter: inputParameter.getInt(),
        boolOp: inputBoolOp.getValue(),
        windA: inputWindA.getValue(),
        windB: inputWindB.getValue(),
        options: inputOptions.getValue(),
    };

    world.writeData(stateData);
}

function updateSystem(world: World): void {
    const { parameter, boolOp, windA, windB, options } = world.readData<AppPartStateData>("app-part-state-data");
    const { seed, generator } = world.readData<AppStateData>("app-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const offset = 2 * (parameter - 100);

    const random = RandomXSR128.fromSeedLcg(seed);
    const [width, height] = ctx.getSize(false);

    const [polygonA, polygonB] = createRandomPolygonPair(random, generator, offset, width, height);

    const clip = new PathClip2(PATH_QUALITY_OPTIONS_DEFAULT);

    for (const edge of polygonA.toEdges()) {
        clip.addEdge(edge, 0);
    }

    for (const edge of polygonB.toEdges()) {
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

    const success = mesh.validate();
    assert(success, "Mesh validation failed");

    const error = Path2.createEmpty();

    for (const face of mesh.getFaces()) {
        const orientation = face.signedArea();

        if (orientation <= 0) {
            log.warn("Negative path area: {}", orientation);
        }

        if (!face.isMonotoneInX()) {
            face.writeToPath(error);
            log.error("Face not monotone");
        }
    }

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        error,
        mesh,
        polygonA,
        polygonB,
    });
}

function renderSystem(world: World): void {
    const { mesh, error } = world.readData<AppPartRemoteData>("app-part-remote-data");
    const { seed } = world.readData<AppStateData>("app-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const random = RandomXSR128.fromSeedLcg(seed);

    ctx.clear();
    ctx.fillMeshRandom(mesh, random);

    const pattern = ctx.createLinePattern(10, "#FF0000") ?? "#FF000022";
    ctx.fillPath(error, pattern);

    ctx.drawMeshEdges(mesh, "#AAAAAA", 1.5);
}

export class TriangulateAppPartModule implements WorldModule {
    public readonly moduleId = "triangulate-app-part-module";

    public setup(world: World): void {
        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

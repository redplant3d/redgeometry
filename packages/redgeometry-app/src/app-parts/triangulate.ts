import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { PATH_QUALITY_OPTIONS_DEFAULT } from "redgeometry/src/core/path-options";
import { Polygon2 } from "redgeometry/src/core/polygon";
import { assert } from "redgeometry/src/internal/debug";
import { log } from "redgeometry/src/internal/log";
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
import { createRandomPolygonPair, getBooleanOperator, getWindingOperator } from "../utility/helper.ts";
import { ComboBoxInputElement, RangeInputElement } from "../utility/html-element.ts";

type TriangulateInputData = {
    dataId: "triangulate-input-data";
    inputBoolOp: ComboBoxInputElement;
    inputOptions: ComboBoxInputElement;
    inputParameter: RangeInputElement;
    inputWindA: ComboBoxInputElement;
    inputWindB: ComboBoxInputElement;
};

type TriangulateStateData = {
    dataId: "triangulate-state-data";
    error: Path2;
    mesh: Mesh2;
    polygonA: Polygon2;
    polygonB: Polygon2;
};

const TRIANGULATE_START_SYSTEM_ID = "triangulate-start-system";
const TRIANGULATE_UPDATE_SYSTEM_ID = "triangulate-update-system";
const TRIANGULATE_RENDER_SYSTEM_ID = "triangulate-render-system";

function triangulateStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

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

    world.setData<TriangulateInputData>({
        dataId: "triangulate-input-data",
        inputParameter,
        inputBoolOp,
        inputWindA,
        inputWindB,
        inputOptions,
    });

    world.setData<TriangulateStateData>({
        dataId: "triangulate-state-data",
        polygonA: Polygon2.createEmpty(),
        polygonB: Polygon2.createEmpty(),
        error: Path2.createEmpty(),
        mesh: Mesh2.createEmpty(),
    });
}

function triangulateUpdateSystem(world: World): void {
    const { inputParameter, inputBoolOp, inputWindA, inputWindB, inputOptions } =
        world.getData<TriangulateInputData>("triangulate-input-data");
    const parameter = inputParameter.getInt();
    const boolOp = inputBoolOp.getValue();
    const windA = inputWindA.getValue();
    const windB = inputWindB.getValue();
    const options = inputOptions.getValue();

    const { generatorTextBox, seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();
    const generator = generatorTextBox.getInt();

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

    world.setData<TriangulateStateData>({
        dataId: "triangulate-state-data",
        error,
        mesh,
        polygonA,
        polygonB,
    });
}

function triangulateRenderSystem(world: World): void {
    const { mesh, error } = world.getData<TriangulateStateData>("triangulate-state-data");
    const { seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const random = RandomXSR128.fromSeedLcg(seed);

    ctx.clear();
    ctx.fillMeshRandom(mesh, random);

    const pattern = ctx.createLinePattern(10, "#FF0000") ?? "#FF000022";
    ctx.fillPath(error, pattern);

    ctx.drawMeshEdges(mesh, "#AAAAAA", 1.5);
}

export const TRIANGULATE_APP_PART_MODULE_ID = "triangulate-app-part-module";

export function triangulateAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<TriangulateInputData>("triangulate-input-data");
    context.addData<TriangulateStateData>("triangulate-state-data");

    context.addSystem({
        id: TRIANGULATE_START_SYSTEM_ID,
        fn: triangulateStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: TRIANGULATE_UPDATE_SYSTEM_ID,
        fn: triangulateUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: TRIANGULATE_RENDER_SYSTEM_ID,
        fn: triangulateRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, TRIANGULATE_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, TRIANGULATE_UPDATE_SYSTEM_ID, TRIANGULATE_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}

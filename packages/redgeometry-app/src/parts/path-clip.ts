import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { PATH_QUALITY_OPTIONS_DEFAULT } from "redgeometry/src/core/path-options";
import { Polygon2 } from "redgeometry/src/core/polygon";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import { AppContextPlugin } from "../ecs-modules/app-context.ts";
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

type PathClipInputData = {
    dataId: "path-clip-input-data";
    inputBoolOp: ComboBoxInputElement;
    inputParameter: RangeInputElement;
    inputWindA: ComboBoxInputElement;
    inputWindB: ComboBoxInputElement;
};

type PathClipStateData = {
    dataId: "path-clip-state-data";
    chains: Path2;
    faces: Path2;
    polygonA: Polygon2;
    polygonB: Polygon2;
};

const APP_PART_START_SYSTEM_ID = "path-clip-start-system";
const APP_PART_UPDATE_SYSTEM_ID = "path-clip-update-system";
const APP_PART_RENDER_SYSTEM_ID = "path-clip-render-system";

function appPartStartSystem(world: World): void {
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

    world.setData<PathClipInputData>({
        dataId: "path-clip-input-data",
        inputParameter,
        inputBoolOp,
        inputWindA,
        inputWindB,
    });

    world.setData<PathClipStateData>({
        dataId: "path-clip-state-data",
        polygonA: Polygon2.createEmpty(),
        polygonB: Polygon2.createEmpty(),
        chains: Path2.createEmpty(),
        faces: Path2.createEmpty(),
    });
}

function appPartUpdateSystem(world: World): void {
    const { inputParameter, inputBoolOp, inputWindA, inputWindB } =
        world.getData<PathClipInputData>("path-clip-input-data");
    const parameter = inputParameter.getInt();
    const boolOp = inputBoolOp.getValue();
    const windA = inputWindA.getValue();
    const windB = inputWindB.getValue();

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

    world.setData<PathClipStateData>({
        dataId: "path-clip-state-data",
        chains: mesh.getChainsPath(),
        faces: mesh.getFacesPath(),
        polygonA,
        polygonB,
    });
}

function appPartRenderSystem(world: World): void {
    const { polygonA, polygonB, chains, faces } = world.getData<PathClipStateData>("path-clip-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
    ctx.fillPolygon(polygonA, "#00FF0022");
    ctx.fillPolygon(polygonB, "#0000FF22");

    const pattern = ctx.createLinePattern(6, "#FF0000") ?? "#FF000022";

    ctx.fillPath(faces, pattern);
    ctx.drawPath(faces, "#FF3333", 1.5);
    ctx.drawPath(chains, "#3333FF", 1.5);
}

export function pathClipAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<PathClipInputData>("path-clip-input-data");
    context.addData<PathClipStateData>("path-clip-state-data");

    context.addSystem({
        id: APP_PART_START_SYSTEM_ID,
        fn: appPartStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: APP_PART_UPDATE_SYSTEM_ID,
        fn: appPartUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: APP_PART_RENDER_SYSTEM_ID,
        fn: appPartRenderSystem,
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

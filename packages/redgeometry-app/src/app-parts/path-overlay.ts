import { Mesh2, type MeshFace2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PATH_QUALITY_OPTIONS_DEFAULT } from "redgeometry/src/core/path-options";
import { PathOverlay2 } from "redgeometry/src/core/path-overlay";
import { Polygon2 } from "redgeometry/src/core/polygon";
import { assert } from "redgeometry/src/internal/debug";
import { Edge2 } from "redgeometry/src/primitives/edge";
import { arrayEquals } from "redgeometry/src/utility/array";
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
import { ColorRgba } from "../utility/color.ts";
import { createRandomPolygonPair, getWindingOperator } from "../utility/helper.ts";
import { ComboBoxInputElement, RangeInputElement } from "../utility/html-element.ts";

type PathOverlayTagEntry = { tag: number[]; faces: MeshFace2[] };

type PathOverlayInputData = {
    dataId: "path-overlay-input-data";
    inputParameter: RangeInputElement;
    inputWind: ComboBoxInputElement;
};

type PathOverlayStateData = {
    dataId: "path-overlay-state-data";
    mesh: Mesh2;
    polygonA: Polygon2;
    polygonB: Polygon2;
    tagEntries: PathOverlayTagEntry[];
};

const PATH_OVERLAY_START_SYSTEM_ID = "path-overlay-start-system";
const PATH_OVERLAY_UPDATE_SYSTEM_ID = "path-overlay-update-system";
const PATH_OVERLAY_RENDER_SYSTEM_ID = "path-overlay-render-system";

function pathOverlayStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputParameter = new RangeInputElement("parameter", "0", "200", "100");
    inputParameter.setStyle("width: 200px");
    inputElements.push(inputParameter);

    const inputWind = new ComboBoxInputElement("wind", "nonzero");
    inputWind.setOptionValues("nonzero", "evenodd", "positive", "negative", "absgeqtwo");
    inputElements.push(inputWind);

    world.setData<PathOverlayInputData>({
        dataId: "path-overlay-input-data",
        inputParameter,
        inputWind,
    });

    world.setData<PathOverlayStateData>({
        dataId: "path-overlay-state-data",
        polygonA: Polygon2.createEmpty(),
        polygonB: Polygon2.createEmpty(),
        mesh: Mesh2.createEmpty(),
        tagEntries: [],
    });
}

function pathOverlayUpdateSystem(world: World): void {
    const { inputParameter, inputWind } = world.getData<PathOverlayInputData>("path-overlay-input-data");
    const parameter = inputParameter.getInt();
    const wind = inputWind.getValue();

    const { generatorTextBox, seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();
    const generator = generatorTextBox.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const offset = 2 * (parameter - 100);

    const random = RandomXSR128.fromSeedLcg(seed);
    const [width, height] = ctx.getSize(false);

    const [polygonA, polygonB] = createRandomPolygonPair(random, generator, offset, width, height);

    const clip = new PathOverlay2(PATH_QUALITY_OPTIONS_DEFAULT);

    for (const edge of polygonA.toEdges()) {
        clip.addEdge(edge, 0);
    }

    for (const edge of polygonB.toEdges()) {
        clip.addEdge(edge, 1);
    }

    clip.addEdge(Edge2.fromXY(325, 175, 350, 175), 2);
    clip.addEdge(Edge2.fromXY(350, 175, 350, 225), 2);
    clip.addEdge(Edge2.fromXY(350, 225, 325, 225), 2);
    clip.addEdge(Edge2.fromXY(325, 225, 325, 175), 2);

    clip.addEdge(Edge2.fromXY(300, 275, 375, 275), 3);
    clip.addEdge(Edge2.fromXY(375, 275, 375, 325), 3);
    clip.addEdge(Edge2.fromXY(375, 325, 300, 325), 3);
    clip.addEdge(Edge2.fromXY(300, 325, 300, 275), 3);

    const mesh = Mesh2.createEmpty();

    clip.process(mesh, getWindingOperator(wind));

    const tagEntries = createTagEntries(mesh);

    world.setData<PathOverlayStateData>({
        dataId: "path-overlay-state-data",
        polygonA,
        polygonB,
        mesh,
        tagEntries,
    });
}

function pathOverlayRenderSystem(world: World): void {
    const { mesh, tagEntries } = world.getData<PathOverlayStateData>("path-overlay-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();

    const styles: string[] = [];
    const step = 1 / tagEntries.length;
    for (let h = 0; h < 1; h += step) {
        const c = ColorRgba.fromHSV(h, 0.25, 1, 1);
        styles.push(c.style());
    }

    for (const face of mesh.getFaces()) {
        const tag = face.data as number[];

        if (tag.length === 0) {
            continue;
        }

        const path = Path2.createEmpty();
        face.writeToPath(path);

        const idx = tagEntries.findIndex((c) => arrayEquals(c.tag, tag));

        if (idx < 0) {
            continue;
        }

        ctx.fillPath(path, styles[idx]);
    }

    ctx.drawMeshEdges(mesh, "#888888", 0.5);
}

function createTagEntries(mesh: Mesh2): PathOverlayTagEntry[] {
    const entries: PathOverlayTagEntry[] = [];

    for (const face of mesh.getFaces()) {
        assert(face.data !== undefined, "Face data must not be undefined");

        const tag = face.data as number[];
        const entry = entries.find((e) => arrayEquals(e.tag, tag));

        if (entry !== undefined) {
            entry.faces.push(face);
        } else {
            entries.push({ tag, faces: [face] });
        }
    }

    for (const entry of entries) {
        if (entry.tag.length > 0) {
            mesh.monotonizeFaces(entry.faces);
        }
    }

    return entries;
}

export const PATH_OVERLAY_APP_PART_MODULE_ID = "path-overlay-app-part-module";

export function pathOverlayAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<PathOverlayInputData>("path-overlay-input-data");
    context.addData<PathOverlayStateData>("path-overlay-state-data");

    context.addSystem({
        id: PATH_OVERLAY_START_SYSTEM_ID,
        fn: pathOverlayStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: PATH_OVERLAY_UPDATE_SYSTEM_ID,
        fn: pathOverlayUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: PATH_OVERLAY_RENDER_SYSTEM_ID,
        fn: pathOverlayRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, PATH_OVERLAY_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, PATH_OVERLAY_UPDATE_SYSTEM_ID, PATH_OVERLAY_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}

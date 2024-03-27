import { Mesh2, type MeshFace2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { DEFAULT_PATH_QUALITY_OPTIONS } from "redgeometry/src/core/path-options";
import { PathOverlay2 } from "redgeometry/src/core/path-overlay";
import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { ColorRgba } from "redgeometry/src/primitives/color";
import { Edge2 } from "redgeometry/src/primitives/edge";
import { Polygon2 } from "redgeometry/src/primitives/polygon";
import { arrayEquals } from "redgeometry/src/utility/array";
import { assertDebug } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs/app-context.js";
import { AppContextModule } from "../ecs/app-context.js";
import type { AppInputData } from "../ecs/app-input.js";
import { ComboBoxInputElement, RangeInputElement } from "../ecs/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs/app.js";
import { createRandomPolygonPair, getWindingOperator } from "../utility/helper.js";
type PathOverlayTagEntry = { tag: number[]; faces: MeshFace2[] };

type AppPartMainData = {
    dataId: "app-part-main";
    inputParameter: RangeInputElement;
    inputWind: ComboBoxInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    mesh: Mesh2;
    polygonA: Polygon2;
    polygonB: Polygon2;
    tagEntries: PathOverlayTagEntry[];
};

type AppPartStateData = {
    dataId: "app-part-state";
    parameter: number;
    wind: string;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputParameter = new RangeInputElement("parameter", "0", "200", "100");
    inputParameter.setStyle("width: 200px");
    inputElements.push(inputParameter);

    const inputWind = new ComboBoxInputElement("wind", "nonzero");
    inputWind.setOptionValues("nonzero", "evenodd", "positive", "negative", "absgeqtwo");
    inputElements.push(inputWind);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputParameter,
        inputWind,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        polygonA: Polygon2.createEmpty(),
        polygonB: Polygon2.createEmpty(),
        mesh: Mesh2.createEmpty(),
        tagEntries: [],
    });
}

function writeStateSystem(world: World): void {
    const { inputParameter, inputWind } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        parameter: inputParameter.getInt(),
        wind: inputWind.getValue(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { parameter, wind } = world.readData<AppPartStateData>("app-part-state");
    const { seed, generator } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const offset = 2 * (parameter - 100);

    const random = RandomXSR128.fromSeedLcg(seed);
    const [width, height] = ctx.getSize(false);

    const [polygonA, polygonB] = createRandomPolygonPair(random, generator, offset, width, height);

    const clip = new PathOverlay2(DEFAULT_PATH_QUALITY_OPTIONS);

    for (const edge of polygonA.getEdges()) {
        clip.addEdge(edge, 0);
    }

    for (const edge of polygonB.getEdges()) {
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

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        polygonA,
        polygonB,
        mesh,
        tagEntries,
    });
}

function renderSystem(world: World): void {
    const { mesh, tagEntries } = world.readData<AppPartRemoteData>("app-part-remote");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

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
        assertDebug(face.data !== undefined, "Face data must not be undefined");

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

export const PATH_OVERLAY_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const PATH_OVERLAY_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

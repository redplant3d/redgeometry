import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { PATH_CLIP_OPTIONS_DEFAULT, PATH_QUALITY_OPTIONS_DEFAULT } from "redgeometry/src/core/path-options";
import { MinMaxBox2 } from "redgeometry/src/primitives/box";
import type { ReadonlyVector2 } from "redgeometry/src/primitives/vector";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { RangeInputElement, type AppInputData } from "../ecs-modules/app-input.ts";
import { type AppStateData } from "../ecs-modules/app.ts";
import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import { type World } from "../ecs/world.ts";
import { createRandomPoint } from "../utility/helper.ts";

type AppPartMainData = {
    dataId: "app-part-main-data";
    inputCount: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote-data";
    mesh: Mesh2;
    points: ReadonlyVector2[];
};

type AppPartStateData = {
    dataId: "app-part-state-data";
    count: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input-data");

    const inputCount = new RangeInputElement("count", "0", "50", "1");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main-data",
        inputCount,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        mesh: Mesh2.createEmpty(),
        points: [],
    });
}

function writeStateSystem(world: World): void {
    const { inputCount } = world.readData<AppPartMainData>("app-part-main-data");

    const stateData: AppPartStateData = {
        dataId: "app-part-state-data",
        count: inputCount.getInt(),
    };

    world.writeData(stateData);
}

function updateSystem(world: World): void {
    const { count } = world.readData<AppPartStateData>("app-part-state-data");
    const { seed } = world.readData<AppStateData>("app-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);
    const box = new MinMaxBox2(0, 0, canvasWidth, canvasHeight);

    const p0 = createRandomPoint(random, box);
    const p1 = createRandomPoint(random, box);
    const p2 = createRandomPoint(random, box);

    const points: ReadonlyVector2[] = [];

    points.push(p0, p1, p2);

    const path = Path2.createEmpty();
    path.moveTo(p0);
    path.lineTo(p1);
    path.lineTo(p2);
    path.close();

    const mesh = Mesh2.createEmpty();
    const pathClip = new PathClip2(PATH_QUALITY_OPTIONS_DEFAULT);
    pathClip.addPath(path);
    pathClip.process(mesh, PATH_CLIP_OPTIONS_DEFAULT);

    for (let i = 0; i < count; i++) {
        const p01 = p0.lerp(p1, random.nextFloat());
        const p12 = p1.lerp(p2, random.nextFloat());
        const pm = p01.lerp(p12, random.nextFloat());
        mesh.triangulateAddPoint(pm);
        points.push(pm);
    }

    mesh.triangulateOptimize();
    mesh.validate();

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote-data",
        mesh,
        points,
    });
}

function renderSystem(world: World): void {
    const { mesh, points } = world.readData<AppPartRemoteData>("app-part-remote-data");
    const { seed } = world.readData<AppStateData>("app-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const random = RandomXSR128.fromSeedLcg(seed);

    ctx.clear();
    ctx.fillMeshRandom(mesh, random);
    ctx.drawMeshEdges(mesh, "#666666", 0.5);
    ctx.fillPoints(points, "#000000", 5);
}

export class MeshAppPartModule implements WorldModule {
    public readonly moduleId = "mesh-app-part-module";

    public setup(world: World): void {
        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

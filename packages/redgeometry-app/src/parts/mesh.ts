import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { DEFAULT_PATH_CLIP_OPTIONS, DEFAULT_PATH_QUALITY_OPTIONS } from "redgeometry/src/core/path-options";
import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { Box2 } from "redgeometry/src/primitives/box";
import type { Point2 } from "redgeometry/src/primitives/point";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs/app-context.js";
import { AppContextModule } from "../ecs/app-context.js";
import type { AppInputData } from "../ecs/app-input.js";
import { RangeInputElement } from "../ecs/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs/app.js";
import { createRandomPoint } from "../utility/helper.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputCount: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    mesh: Mesh2;
    points: Point2[];
};

type AppPartStateData = {
    dataId: "app-part-state";
    count: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputCount = new RangeInputElement("count", "0", "50", "1");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputCount,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        mesh: Mesh2.createEmpty(),
        points: [],
    });
}

function writeStateSystem(world: World): void {
    const { inputCount } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        count: inputCount.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { count } = world.readData<AppPartStateData>("app-part-state");
    const { seed } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);
    const box = new Box2(0, 0, canvasWidth, canvasHeight);

    const p0 = createRandomPoint(random, box);
    const p1 = createRandomPoint(random, box);
    const p2 = createRandomPoint(random, box);

    const points: Point2[] = [];

    points.push(p0, p1, p2);

    const path = Path2.createEmpty();
    path.moveTo(p0);
    path.lineTo(p1);
    path.lineTo(p2);
    path.close();

    const mesh = Mesh2.createEmpty();
    const pathClip = new PathClip2(DEFAULT_PATH_QUALITY_OPTIONS);
    pathClip.addPath(path);
    pathClip.process(mesh, DEFAULT_PATH_CLIP_OPTIONS);

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
        dataId: "app-part-remote",
        mesh,
        points,
    });
}

function renderSystem(world: World): void {
    const { mesh, points } = world.readData<AppPartRemoteData>("app-part-remote");
    const { seed } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const random = RandomXSR128.fromSeedLcg(seed);

    ctx.clear();
    ctx.fillMeshRandom(mesh, random);
    ctx.drawMeshEdges(mesh, "#666666", 0.5);
    ctx.fillPoints(points, "#000000", 5);
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

export const MESH_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const MESH_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

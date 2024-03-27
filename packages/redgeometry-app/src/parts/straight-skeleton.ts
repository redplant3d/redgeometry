import { Mesh2 } from "redgeometry/src/core/mesh";
import { WindingOperator } from "redgeometry/src/core/path-options";
import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { Box2 } from "redgeometry/src/primitives/box";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContextPlugin } from "../ecs/app-context.js";
import { AppContextModule } from "../ecs/app-context.js";
import type { AppInputData } from "../ecs/app-input.js";
import { RangeInputElement } from "../ecs/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs/app.js";
import { createRandomPolygonSimple } from "../utility/helper.js";
import { StraightSkeleton } from "../utility/straight-skeleton.js";

type AppPartMainData = {
    dataId: "app-part-main";
    inputTime: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    mesh: Mesh2;
    meshOriginal: Mesh2;
    skeleton: StraightSkeleton;
};

type AppPartStateData = {
    dataId: "app-part-state";
    time: number;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputTime = new RangeInputElement("time", "0", "500", "50");
    inputTime.setStyle("width: 200px");
    inputElements.push(inputTime);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputTime,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        mesh: Mesh2.createEmpty(),
        meshOriginal: Mesh2.createEmpty(),
        skeleton: new StraightSkeleton(),
    });
}

function writeStateSystem(world: World): void {
    const { inputTime } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        time: inputTime.getInt(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { time } = world.readData<AppPartStateData>("app-part-state");
    const { seed, generator } = world.readData<AppStateData>("app-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);
    const box = new Box2(0, 0, canvasWidth, canvasHeight);

    const tmax = time;

    // const path = createSimplePolygon(random, box, generator, 0.5, 0.25).toPath();
    const path = createRandomPolygonSimple(random, box, generator, 1, 0).toPath();
    // const path = createSimplePolygon(random, box, generator, 0.05, 0.95).toPath();

    // path.clear();
    // path.moveToXY(100, 100);
    // path.lineToXY(200, 100);
    // path.lineToXY(300, 100);
    // path.lineToXY(300, 200);
    // path.lineToXY(200, 200);
    // path.lineToXY(100, 200);
    // path.close();

    const mesh = path.toMesh(WindingOperator.NonZero);
    // const mesh = this.getRandomMesh(random, generator, 25, canvasWidth, canvasHeight);

    const meshOriginal = mesh.clone();

    mesh.triangulate(false);

    const skeleton = new StraightSkeleton();
    skeleton.initializeMesh(mesh);
    skeleton.createStraightSkeleton(mesh, tmax);

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        mesh,
        meshOriginal,
        skeleton,
    });
}

function renderSystem(world: World): void {
    const { skeleton, meshOriginal, mesh } = world.readData<AppPartRemoteData>("app-part-remote");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    ctx.clear();
    ctx.drawEdges(skeleton.getVertexEdges(), "#FF0000");
    ctx.drawMeshEdges(meshOriginal, "#000000");
    ctx.drawMeshEdges(mesh, "#00FF00");
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

export const STRAIGHT_SKELETON_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const STRAIGHT_SKELETON_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

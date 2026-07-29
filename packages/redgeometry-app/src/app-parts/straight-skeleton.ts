import { Mesh2 } from "redgeometry/src/core/mesh";
import { WindingOperator } from "redgeometry/src/core/winding";
import { MinMaxBox2 } from "redgeometry/src/primitives/box";
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
import { createRandomPolygonSimple } from "../utility/helper.ts";
import { RangeInputElement } from "../utility/html-element.ts";
import { StraightSkeleton } from "../utility/straight-skeleton.ts";

type StraightSkeletonInputData = {
    dataId: "straight-skeleton-input-data";
    inputTime: RangeInputElement;
};

type StraightSkeletonStateData = {
    dataId: "straight-skeleton-state-data";
    mesh: Mesh2;
    meshOriginal: Mesh2;
    skeleton: StraightSkeleton;
};

const STRAIGHT_SKELETON_START_SYSTEM_ID = "straight-skeleton-start-system";
const STRAIGHT_SKELETON_UPDATE_SYSTEM_ID = "straight-skeleton-update-system";
const STRAIGHT_SKELETON_RENDER_SYSTEM_ID = "straight-skeleton-render-system";

function straightSkeletonStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputTime = new RangeInputElement("time", "0", "500", "50");
    inputTime.setStyle("width: 200px");
    inputElements.push(inputTime);

    world.setData<StraightSkeletonInputData>({
        dataId: "straight-skeleton-input-data",
        inputTime,
    });

    world.setData<StraightSkeletonStateData>({
        dataId: "straight-skeleton-state-data",
        mesh: Mesh2.createEmpty(),
        meshOriginal: Mesh2.createEmpty(),
        skeleton: new StraightSkeleton(),
    });
}

function straightSkeletonUpdateSystem(world: World): void {
    const { inputTime } = world.getData<StraightSkeletonInputData>("straight-skeleton-input-data");
    const time = inputTime.getInt();

    const { generatorTextBox, seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();
    const generator = generatorTextBox.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const random = RandomXSR128.fromSeedLcg(seed);
    const [canvasWidth, canvasHeight] = ctx.getSize(false);
    const box = new MinMaxBox2(0, 0, canvasWidth, canvasHeight);

    const tmax = time;

    // const path = createRandomPolygonSimple(random, box, generator, 0.5, 0.25).toPath();
    const path = createRandomPolygonSimple(random, box, generator, 1, 0).toPath();
    // const path = createRandomPolygonSimple(random, box, generator, 0.05, 0.95).toPath();

    // path.clear();
    // path.moveToXY(100, 100);
    // path.lineToXY(200, 100);
    // path.lineToXY(300, 100);
    // path.lineToXY(300, 200);
    // path.lineToXY(200, 200);
    // path.lineToXY(100, 200);
    // path.close();

    const mesh = path.toMesh(WindingOperator.NON_ZERO);
    // const mesh = this.getRandomMesh(random, generator, 25, canvasWidth, canvasHeight);

    const meshOriginal = mesh.clone();

    mesh.triangulate(false);

    const skeleton = new StraightSkeleton();
    skeleton.initializeMesh(mesh);
    skeleton.createStraightSkeleton(mesh, tmax);

    world.setData<StraightSkeletonStateData>({
        dataId: "straight-skeleton-state-data",
        mesh,
        meshOriginal,
        skeleton,
    });
}

function straightSkeletonRenderSystem(world: World): void {
    const { skeleton, meshOriginal, mesh } = world.getData<StraightSkeletonStateData>("straight-skeleton-state-data");

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    ctx.clear();
    ctx.drawEdges(skeleton.getVertexEdges(), "#FF0000");
    ctx.drawMeshEdges(meshOriginal, "#000000");
    ctx.drawMeshEdges(mesh, "#00FF00");
}

export const STRAIGHT_SKELETON_APP_PART_MODULE_ID = "straight-skeleton-app-part-module";

export function straightSkeletonAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<StraightSkeletonInputData>("straight-skeleton-input-data");
    context.addData<StraightSkeletonStateData>("straight-skeleton-state-data");

    context.addSystem({
        id: STRAIGHT_SKELETON_START_SYSTEM_ID,
        fn: straightSkeletonStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: STRAIGHT_SKELETON_UPDATE_SYSTEM_ID,
        fn: straightSkeletonUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: STRAIGHT_SKELETON_RENDER_SYSTEM_ID,
        fn: straightSkeletonRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, STRAIGHT_SKELETON_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, STRAIGHT_SKELETON_UPDATE_SYSTEM_ID, STRAIGHT_SKELETON_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}

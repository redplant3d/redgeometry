import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { PATH_CLIP_OPTIONS_DEFAULT, PATH_QUALITY_OPTIONS_DEFAULT } from "redgeometry/src/core/path-options";
import { assert } from "redgeometry/src/internal/debug";
import { MinMaxBox2 } from "redgeometry/src/primitives/box";
import type { ReadonlyVector2 } from "redgeometry/src/primitives/vector";
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
import { createRandomPoint } from "../utility/helper.ts";
import { RangeInputElement } from "../utility/html-element.ts";

type MeshInputData = {
    dataId: "mesh-input-data";
    inputCount: RangeInputElement;
};

type MeshStateData = {
    dataId: "mesh-state-data";
    mesh: Mesh2;
    points: ReadonlyVector2[];
};

const MESH_START_SYSTEM_ID = "mesh-start-system";
const MESH_UPDATE_SYSTEM_ID = "mesh-update-system";
const MESH_RENDER_SYSTEM_ID = "mesh-render-system";

function meshStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputCount = new RangeInputElement("count", "0", "50", "1");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    world.setData<MeshInputData>({
        dataId: "mesh-input-data",
        inputCount,
    });

    world.setData<MeshStateData>({
        dataId: "mesh-state-data",
        mesh: Mesh2.createEmpty(),
        points: [],
    });
}

function meshUpdateSystem(world: World): void {
    const { inputCount } = world.getData<MeshInputData>("mesh-input-data");
    const count = inputCount.getInt();

    const { seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

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

    const success = mesh.validate();
    assert(success, "Mesh validation failed");

    world.setData<MeshStateData>({
        dataId: "mesh-state-data",
        mesh,
        points,
    });
}

function meshRenderSystem(world: World): void {
    const { mesh, points } = world.getData<MeshStateData>("mesh-state-data");
    const { seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const random = RandomXSR128.fromSeedLcg(seed);

    ctx.clear();
    ctx.fillMeshRandom(mesh, random);
    ctx.drawMeshEdges(mesh, "#666666", 0.5);
    ctx.fillPoints(points, "#000000", 5);
}

export const MESH_APP_PART_MODULE_ID = "mesh-app-part-module";

export function meshAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<MeshInputData>("mesh-input-data");
    context.addData<MeshStateData>("mesh-state-data");

    context.addSystem({
        id: MESH_START_SYSTEM_ID,
        fn: meshStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: MESH_UPDATE_SYSTEM_ID,
        fn: meshUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: MESH_RENDER_SYSTEM_ID,
        fn: meshRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, MESH_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, MESH_UPDATE_SYSTEM_ID, MESH_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}

import { RandomXSR128 } from "redgeometry/src/utility/random";
import { LocalAppContext, WebAppContext } from "./ecs/app.js";
import type { Component } from "./ecs/types.js";
import { BPLUS_TREE_MAIN_WORLD, BPLUS_TREE_REMOTE_WORLD } from "./parts/bplus-tree.js";
import { ECS_MAIN_WORLD, ECS_REMOTE_WORLD } from "./parts/ecs-bounce.js";
import { GPU_CUBE_MAIN_WORLD, GPU_CUBE_REMOTE_WORLD } from "./parts/gpu-cube.js";
import { IMAGE_MAIN_WORLD, IMAGE_REMOTE_WORLD } from "./parts/image.js";
import { MATRIX_MAIN_WORLD, MATRIX_REMOTE_WORLD } from "./parts/matrix.js";
import { MESH_MAIN_WORLD, MESH_REMOTE_WORLD } from "./parts/mesh.js";
import { PATH_AREA_MAIN_WORLD, PATH_AREA_REMOTE_WORLD } from "./parts/path-area.js";
import { PATH_CLIP_MAIN_WORLD, PATH_CLIP_REMOTE_WORLD } from "./parts/path-clip.js";
import { PATH_INTERSECTION_MAIN_WORLD, PATH_INTERSECTION_REMOTE_WORLD } from "./parts/path-intersection.js";
import { PATH_OPERATIONS_MAIN_WORLD, PATH_OPERATIONS_REMOTE_WORLD } from "./parts/path-operations.js";
import { PATH_OVERLAY_MAIN_WORLD, PATH_OVERLAY_REMOTE_WORLD } from "./parts/path-overlay.js";
import { PLAYGROUND_MAIN_WORLD, PLAYGROUND_REMOTE_WORLD } from "./parts/playground.js";
import { SAMPLING_MAIN_WORLD, SAMPLING_REMOTE_WORLD } from "./parts/sampling.js";
import { SNAP_ROUNDING_MAIN_WORLD, SNAP_ROUNDING_REMOTE_WORLD } from "./parts/snap-rounding.js";
import { STRAIGHT_SKELETON_MAIN_WORLD, STRAIGHT_SKELETON_REMOTE_WORLD } from "./parts/straight-skeleton.js";
import { TRIANGULATE_MAIN_WORLD, TRIANGULATE_REMOTE_WORLD } from "./parts/triangulate.js";
import {
    buildComponenSetStateGraphviz,
    EntityComponentStorage,
    type EntityComponentQuery,
} from "./utility/ecs-storage-table.js";
import { AppLauncher } from "./utility/launcher.js";

// const context: LocalAppContext | WebAppContext = new LocalAppContext();
const context: LocalAppContext | WebAppContext = new WebAppContext("index.js");

const launcher = new AppLauncher(context);
launcher.addPart(
    { id: "bplus-tree", runWorldId: "main", runScheduleId: "start" },
    { id: "bplus-tree-main", parent: undefined, worlds: [BPLUS_TREE_MAIN_WORLD] },
    { id: "bplus-tree-remote", parent: "bplus-tree-main", worlds: [BPLUS_TREE_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "ecs-bounce", runWorldId: "main", runScheduleId: "start" },
    { id: "ecs-bounce-main", parent: undefined, worlds: [ECS_MAIN_WORLD] },
    { id: "ecs-bounce-remote", parent: "ecs-bounce-main", worlds: [ECS_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "gpu-cube", runWorldId: "main", runScheduleId: "start" },
    { id: "gpu-cube-main", parent: undefined, worlds: [GPU_CUBE_MAIN_WORLD] },
    { id: "gpu-cube-remote", parent: "gpu-cube-main", worlds: [GPU_CUBE_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "image", runWorldId: "main", runScheduleId: "start" },
    { id: "image-main", parent: undefined, worlds: [IMAGE_MAIN_WORLD] },
    { id: "image-remote", parent: "image-main", worlds: [IMAGE_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "matrix", runWorldId: "main", runScheduleId: "start" },
    { id: "matrix-main", parent: undefined, worlds: [MATRIX_MAIN_WORLD] },
    { id: "matrix-remote", parent: "matrix-main", worlds: [MATRIX_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "mesh", runWorldId: "main", runScheduleId: "start" },
    { id: "mesh-main", parent: undefined, worlds: [MESH_MAIN_WORLD] },
    { id: "mesh-remote", parent: "mesh-main", worlds: [MESH_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "path-area", runWorldId: "main", runScheduleId: "start" },
    { id: "path-area-main", parent: undefined, worlds: [PATH_AREA_MAIN_WORLD] },
    { id: "path-area-remote", parent: "path-area-main", worlds: [PATH_AREA_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "path-clip", runWorldId: "main", runScheduleId: "start" },
    { id: "path-clip-main", parent: undefined, worlds: [PATH_CLIP_MAIN_WORLD] },
    { id: "path-clip-remote", parent: "path-clip-main", worlds: [PATH_CLIP_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "path-intersection", runWorldId: "main", runScheduleId: "start" },
    { id: "path-intersection-main", parent: undefined, worlds: [PATH_INTERSECTION_MAIN_WORLD] },
    { id: "path-intersection-remote", parent: "path-intersection-main", worlds: [PATH_INTERSECTION_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "path-operations", runWorldId: "main", runScheduleId: "start" },
    { id: "path-operations-main", parent: undefined, worlds: [PATH_OPERATIONS_MAIN_WORLD] },
    { id: "path-operations-remote", parent: "path-operations-main", worlds: [PATH_OPERATIONS_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "path-overlay", runWorldId: "main", runScheduleId: "start" },
    { id: "path-overlay-main", parent: undefined, worlds: [PATH_OVERLAY_MAIN_WORLD] },
    { id: "path-overlay-remote", parent: "path-overlay-main", worlds: [PATH_OVERLAY_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "playground", runWorldId: "main", runScheduleId: "start" },
    { id: "playground-main", parent: undefined, worlds: [PLAYGROUND_MAIN_WORLD] },
    { id: "playground-remote", parent: "playground-main", worlds: [PLAYGROUND_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "sampling", runWorldId: "main", runScheduleId: "start" },
    { id: "sampling-main", parent: undefined, worlds: [SAMPLING_MAIN_WORLD] },
    { id: "sampling-remote", parent: "sampling-main", worlds: [SAMPLING_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "snap-rounding", runWorldId: "main", runScheduleId: "start" },
    { id: "snap-rounding-main", parent: undefined, worlds: [SNAP_ROUNDING_MAIN_WORLD] },
    { id: "snap-rounding-remote", parent: "snap-rounding-main", worlds: [SNAP_ROUNDING_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "straight-skeleton", runWorldId: "main", runScheduleId: "start" },
    { id: "straight-skeleton-main", parent: undefined, worlds: [STRAIGHT_SKELETON_MAIN_WORLD] },
    { id: "straight-skeleton-remote", parent: "straight-skeleton-main", worlds: [STRAIGHT_SKELETON_REMOTE_WORLD] },
);
launcher.addPart(
    { id: "triangulate", runWorldId: "main", runScheduleId: "start" },
    { id: "triangulate-main", parent: undefined, worlds: [TRIANGULATE_MAIN_WORLD] },
    { id: "triangulate-remote", parent: "triangulate-main", worlds: [TRIANGULATE_REMOTE_WORLD] },
);
// launcher.run("playground");

type ComponentA = { componentId: "component-a"; a: number };
const componentA = { componentId: "component-a", a: 0 } satisfies ComponentA;

type ComponentB = { componentId: "component-b"; b: number };
const componentB = { componentId: "component-b", b: 0 } satisfies ComponentB;

type ComponentC = { componentId: "component-c"; c: number };
const componentC = { componentId: "component-c", c: 0 } satisfies ComponentC;

type ComponentD = { componentId: "component-d"; d: number };
const componentD = { componentId: "component-d", d: 0 } satisfies ComponentD;

type ComponentE = { componentId: "component-e"; e: number };
const componentE = { componentId: "component-e", e: 0 } satisfies ComponentE;

const ecStorage = new EntityComponentStorage();

test(ecStorage);

try {
    const data = buildComponenSetStateGraphviz(ecStorage.componentSetStates);
    await navigator.clipboard.writeText(data);
    console.log(`Graphviz content copied to clipboard (${data.length} bytes)`);
} catch (error: unknown) {
    console.error("Unable to copy content to clipboard (document is not focused)");
}

function createManyEntities(ecStorage: EntityComponentStorage): void {
    const random = RandomXSR128.fromSeedLcg(0);

    console.time("createEntities");
    for (let i = 0; i < 1000000; i += 1) {
        const components: Component[] = [];

        if (random.nextFloat() < 0.83) components.push(componentA);
        if (random.nextFloat() < 0.66) components.push(componentB);
        if (random.nextFloat() < 0.5) components.push(componentC);
        if (random.nextFloat() < 0.33) components.push(componentD);
        if (random.nextFloat() < 0.16) components.push(componentE);

        ecStorage.createEntity(components);
    }
    console.timeEnd("createEntities");

    const queryFn = (q: EntityComponentQuery<ComponentA | ComponentB | ComponentC>): boolean =>
        q.hasComponent("component-a") &&
        q.hasComponent("component-b") &&
        q.hasComponent("component-c") &&
        q.isEntityDestroyed();

    let sum = 0;

    for (let i = 0; i < 1000; i += 1) {
        const query = ecStorage.queryEntities(queryFn);
        while (query.next()) {
            sum += 1;
        }
    }

    sum = 0;

    console.time("queryEntities");
    for (let i = 0; i < 1000000; i += 1) {
        const query = ecStorage.queryEntities(queryFn);
        while (query.next()) {
            sum += 1;
        }
    }
    console.timeEnd("queryEntities");
    console.log("sum =", sum);

    console.log({
        setCount: ecStorage.componenSets.length,
        setStorageCount: ecStorage.componentSetStorages.length,
        setStateCount: ecStorage.componentSetStates.length,
    });

    console.time("reset");
    ecStorage.reset();
    console.timeEnd("reset");

    console.log({
        setCount: ecStorage.componenSets.length,
        setStorageCount: ecStorage.componentSetStorages.length,
        setStateCount: ecStorage.componentSetStates.length,
    });
}

function test(ecStorage: EntityComponentStorage): void {
    const entityId1 = ecStorage.createEntity<[ComponentA]>([componentA]);
    const entityId2 = ecStorage.createEntity<[ComponentB]>([componentB]);
    ecStorage.reset();
    ecStorage.updateComponent<ComponentA>(entityId1, "component-a");
    ecStorage.addComponent<ComponentA>(entityId2, componentA);
    ecStorage.reset();
    ecStorage.disableEntity(entityId2);
    ecStorage.reset();
    ecStorage.enableEntity(entityId2);
    ecStorage.reset();
    ecStorage.deleteComponent<ComponentB>(entityId2, "component-b");
    ecStorage.reset();

    console.log(ecStorage.componentSetStates);
}

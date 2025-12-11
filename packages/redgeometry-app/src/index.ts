import { LocalAppContext } from "./ecs/app.ts";
import { ECS_MAIN_WORLD } from "./parts/ecs-bounce.ts";
import { MATRIX_MAIN_WORLD } from "./parts/matrix.ts";
import { MESH_NEXT_MAIN_WORLD } from "./parts/mesh-next.ts";
import { MESH_MAIN_WORLD } from "./parts/mesh.ts";
import { PATH_AREA_MAIN_WORLD } from "./parts/path-area.ts";
import { PATH_CLIP_MAIN_WORLD } from "./parts/path-clip.ts";
import { PATH_INTERSECTION_MAIN_WORLD } from "./parts/path-intersection.ts";
import { PATH_OPERATIONS_MAIN_WORLD } from "./parts/path-operations.ts";
import { PATH_OVERLAY_MAIN_WORLD } from "./parts/path-overlay.ts";
import { PLAYGROUND_MAIN_WORLD } from "./parts/playground.ts";
import { POLYGON_MINKOWSKI_MAIN_WORLD } from "./parts/polygon-minkowski.ts";
import { SAMPLING_MAIN_WORLD } from "./parts/sampling.ts";
import { SNAP_ROUNDING_MAIN_WORLD } from "./parts/snap-rounding.ts";
import { STRAIGHT_SKELETON_MAIN_WORLD } from "./parts/straight-skeleton.ts";
import { TRIANGULATE_MAIN_WORLD } from "./parts/triangulate.ts";
import { AppLauncher } from "./utility/launcher.ts";

const context = new LocalAppContext();

const launcher = new AppLauncher(context);
launcher.addPart(
    { id: "ecs-bounce", runWorldId: "main", runScheduleId: "start" },
    { id: "ecs-bounce-main", parent: undefined, worlds: [ECS_MAIN_WORLD] },
);
launcher.addPart(
    { id: "matrix", runWorldId: "main", runScheduleId: "start" },
    { id: "matrix-main", parent: undefined, worlds: [MATRIX_MAIN_WORLD] },
);
launcher.addPart(
    { id: "mesh", runWorldId: "main", runScheduleId: "start" },
    { id: "mesh-main", parent: undefined, worlds: [MESH_MAIN_WORLD] },
);
launcher.addPart(
    { id: "mesh-next", runWorldId: "main", runScheduleId: "start" },
    { id: "mesh-next-main", parent: undefined, worlds: [MESH_NEXT_MAIN_WORLD] },
);
launcher.addPart(
    { id: "path-area", runWorldId: "main", runScheduleId: "start" },
    { id: "path-area-main", parent: undefined, worlds: [PATH_AREA_MAIN_WORLD] },
);
launcher.addPart(
    { id: "path-clip", runWorldId: "main", runScheduleId: "start" },
    { id: "path-clip-main", parent: undefined, worlds: [PATH_CLIP_MAIN_WORLD] },
);
launcher.addPart(
    { id: "path-intersection", runWorldId: "main", runScheduleId: "start" },
    { id: "path-intersection-main", parent: undefined, worlds: [PATH_INTERSECTION_MAIN_WORLD] },
);
launcher.addPart(
    { id: "path-operations", runWorldId: "main", runScheduleId: "start" },
    { id: "path-operations-main", parent: undefined, worlds: [PATH_OPERATIONS_MAIN_WORLD] },
);
launcher.addPart(
    { id: "path-overlay", runWorldId: "main", runScheduleId: "start" },
    { id: "path-overlay-main", parent: undefined, worlds: [PATH_OVERLAY_MAIN_WORLD] },
);
launcher.addPart(
    { id: "polygon-minkowski", runWorldId: "main", runScheduleId: "start" },
    { id: "polygon-minkowski-main", parent: undefined, worlds: [POLYGON_MINKOWSKI_MAIN_WORLD] },
);
launcher.addPart(
    { id: "playground", runWorldId: "main", runScheduleId: "start" },
    { id: "playground-main", parent: undefined, worlds: [PLAYGROUND_MAIN_WORLD] },
);
launcher.addPart(
    { id: "sampling", runWorldId: "main", runScheduleId: "start" },
    { id: "sampling-main", parent: undefined, worlds: [SAMPLING_MAIN_WORLD] },
);
launcher.addPart(
    { id: "snap-rounding", runWorldId: "main", runScheduleId: "start" },
    { id: "snap-rounding-main", parent: undefined, worlds: [SNAP_ROUNDING_MAIN_WORLD] },
);
launcher.addPart(
    { id: "straight-skeleton", runWorldId: "main", runScheduleId: "start" },
    { id: "straight-skeleton-main", parent: undefined, worlds: [STRAIGHT_SKELETON_MAIN_WORLD] },
);
launcher.addPart(
    { id: "triangulate", runWorldId: "main", runScheduleId: "start" },
    { id: "triangulate-main", parent: undefined, worlds: [TRIANGULATE_MAIN_WORLD] },
);
launcher.run("ecs-bounce");

import { ECS_BOUNCE_APP_PART_MODULE_ID, ecsBounceAppPartModule } from "./app-parts/ecs-bounce.ts";
import { MATRIX_APP_PART_MODULE_ID, matrixAppPartModule } from "./app-parts/matrix.ts";
import { MESH_NEXT_APP_PART_MODULE_ID, meshNextAppPartModule } from "./app-parts/mesh-next.ts";
import { MESH_APP_PART_MODULE_ID, meshAppPartModule } from "./app-parts/mesh.ts";
import { PATH_AREA_APP_PART_MODULE_ID, pathAreaAppPartModule } from "./app-parts/path-area.ts";
import { PATH_CLIP_APP_PART_MODULE_ID, pathClipAppPartModule } from "./app-parts/path-clip.ts";
import { PATH_INTERSECTION_APP_PART_MODULE_ID, pathIntersectionAppPartModule } from "./app-parts/path-intersection.ts";
import { PATH_OPERATION_APP_PART_MODULE_ID, pathOperationAppPartModule } from "./app-parts/path-operations.ts";
import { PATH_OVERLAY_APP_PART_MODULE_ID, pathOverlayAppPartModule } from "./app-parts/path-overlay.ts";
import { PLAYGROUND_APP_PART_MODULE_ID, playgroundAppPartModule } from "./app-parts/playground.ts";
import { POLYGON_MINKOWSKI_APP_PART_MODULE_ID, polygonMinkowskiAppPartModule } from "./app-parts/polygon-minkowski.ts";
import { SAMPLING_APP_PART_MODULE_ID, samplingAppPartModule } from "./app-parts/sampling.ts";
import { SNAP_ROUNDING_APP_PART_MODULE_ID, snapRoundingAppPartModule } from "./app-parts/snap-rounding.ts";
import { STRAIGHT_SKELETON_APP_PART_MODULE_ID, straightSkeletonAppPartModule } from "./app-parts/straight-skeleton.ts";
import { TRIANGULATE_APP_PART_MODULE_ID, triangulateAppPartModule } from "./app-parts/triangulate.ts";
import { AppLauncher } from "./utility/app-launcher.ts";

const launcher = new AppLauncher();
launcher.addPart("ecs-bounce", {
    id: ECS_BOUNCE_APP_PART_MODULE_ID,
    fn: ecsBounceAppPartModule,
});
launcher.addPart("matrix", {
    id: MATRIX_APP_PART_MODULE_ID,
    fn: matrixAppPartModule,
});
launcher.addPart("mesh", {
    id: MESH_APP_PART_MODULE_ID,
    fn: meshAppPartModule,
});
launcher.addPart("mesh-next", {
    id: MESH_NEXT_APP_PART_MODULE_ID,
    fn: meshNextAppPartModule,
});
launcher.addPart("path-area", {
    id: PATH_AREA_APP_PART_MODULE_ID,
    fn: pathAreaAppPartModule,
});
launcher.addPart("path-clip", {
    id: PATH_CLIP_APP_PART_MODULE_ID,
    fn: pathClipAppPartModule,
});
launcher.addPart("path-intersection", {
    id: PATH_INTERSECTION_APP_PART_MODULE_ID,
    fn: pathIntersectionAppPartModule,
});
launcher.addPart("path-operations", {
    id: PATH_OPERATION_APP_PART_MODULE_ID,
    fn: pathOperationAppPartModule,
});
launcher.addPart("path-overlay", {
    id: PATH_OVERLAY_APP_PART_MODULE_ID,
    fn: pathOverlayAppPartModule,
});
launcher.addPart("playground", {
    id: PLAYGROUND_APP_PART_MODULE_ID,
    fn: playgroundAppPartModule,
});
launcher.addPart("polygon-minkowski", {
    id: POLYGON_MINKOWSKI_APP_PART_MODULE_ID,
    fn: polygonMinkowskiAppPartModule,
});
launcher.addPart("sampling", {
    id: SAMPLING_APP_PART_MODULE_ID,
    fn: samplingAppPartModule,
});
launcher.addPart("snap-rounding", {
    id: SNAP_ROUNDING_APP_PART_MODULE_ID,
    fn: snapRoundingAppPartModule,
});
launcher.addPart("straight-skeleton", {
    id: STRAIGHT_SKELETON_APP_PART_MODULE_ID,
    fn: straightSkeletonAppPartModule,
});
launcher.addPart("triangulate", {
    id: TRIANGULATE_APP_PART_MODULE_ID,
    fn: triangulateAppPartModule,
});

await launcher.runPart("ecs-bounce");

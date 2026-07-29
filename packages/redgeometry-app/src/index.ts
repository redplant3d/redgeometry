import { ecsBounceAppPartModule } from "./app-parts/ecs-bounce.ts";
import { matrixAppPartModule } from "./app-parts/matrix.ts";
import { meshNextAppPartModule } from "./app-parts/mesh-next.ts";
import { meshAppPartModule } from "./app-parts/mesh.ts";
import { pathAreaAppPartModule } from "./app-parts/path-area.ts";
import { pathClipAppPartModule } from "./app-parts/path-clip.ts";
import { pathIntersectionAppPartModule } from "./app-parts/path-intersection.ts";
import { pathOperationAppPartModule } from "./app-parts/path-operations.ts";
import { pathOverlayAppPartModule } from "./app-parts/path-overlay.ts";
import { playgroundAppPartModule } from "./app-parts/playground.ts";
import { polygonMinkowskiAppPartModule } from "./app-parts/polygon-minkowski.ts";
import { samplingAppPartModule } from "./app-parts/sampling.ts";
import { snapRoundingAppPartModule } from "./app-parts/snap-rounding.ts";
import { straightSkeletonAppPartModule } from "./app-parts/straight-skeleton.ts";
import { triangulateAppPartModule } from "./app-parts/triangulate.ts";
import { AppLauncher } from "./utility/app-launcher.ts";

const launcher = new AppLauncher();
launcher.addPart("ecs-bounce", {
    id: "ecs-bounce-app-part-module",
    fn: ecsBounceAppPartModule,
});
launcher.addPart("matrix", {
    id: "matrix-app-part-module",
    fn: matrixAppPartModule,
});
launcher.addPart("mesh", {
    id: "mesh-app-part-module",
    fn: meshAppPartModule,
});
launcher.addPart("mesh-next", {
    id: "mesh-next-app-part-module",
    fn: meshNextAppPartModule,
});
launcher.addPart("path-area", {
    id: "path-area-app-part-module",
    fn: pathAreaAppPartModule,
});
launcher.addPart("path-clip", {
    id: "path-clip-app-part-module",
    fn: pathClipAppPartModule,
});
launcher.addPart("path-intersection", {
    id: "path-intersection-app-part-module",
    fn: pathIntersectionAppPartModule,
});
launcher.addPart("path-operations", {
    id: "path-operations-app-part-module",
    fn: pathOperationAppPartModule,
});
launcher.addPart("path-overlay", {
    id: "path-overlay-app-part-module",
    fn: pathOverlayAppPartModule,
});
launcher.addPart("playground", {
    id: "playground-app-part-module",
    fn: playgroundAppPartModule,
});
launcher.addPart("polygon-minkowski", {
    id: "polygon-minkowski-app-part-module",
    fn: polygonMinkowskiAppPartModule,
});
launcher.addPart("sampling", {
    id: "sampling-app-part-module",
    fn: samplingAppPartModule,
});
launcher.addPart("snap-rounding", {
    id: "snap-rounding-app-part-module",
    fn: snapRoundingAppPartModule,
});
launcher.addPart("straight-skeleton", {
    id: "straight-skeleton-app-part-module",
    fn: straightSkeletonAppPartModule,
});
launcher.addPart("triangulate", {
    id: "triangulate-app-part-module",
    fn: triangulateAppPartModule,
});

await launcher.runPart("ecs-bounce");

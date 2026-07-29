import { ecsBounceAppPartModule } from "./parts/ecs-bounce.ts";
import { matrixAppPartModule } from "./parts/matrix.ts";
import { meshNextAppPartModule } from "./parts/mesh-next.ts";
import { meshAppPartModule } from "./parts/mesh.ts";
import { pathAreaAppPartModule } from "./parts/path-area.ts";
import { pathClipAppPartModule } from "./parts/path-clip.ts";
import { pathIntersectionAppPartModule } from "./parts/path-intersection.ts";
import { pathOperationAppPartModule } from "./parts/path-operations.ts";
import { pathOverlayAppPartModule } from "./parts/path-overlay.ts";
import { playgroundAppPartModule } from "./parts/playground.ts";
import { polygonMinkowskiAppPartModule } from "./parts/polygon-minkowski.ts";
import { samplingAppPartModule } from "./parts/sampling.ts";
import { snapRoundingAppPartModule } from "./parts/snap-rounding.ts";
import { straightSkeletonAppPartModule } from "./parts/straight-skeleton.ts";
import { triangulateAppPartModule } from "./parts/triangulate.ts";
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

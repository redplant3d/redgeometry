import { AnimationMode, AppLauncher } from "./launcher";
import { BPlusTreeAppPart } from "./parts/bplustree";
import { EcsAppPart } from "./parts/ecs";
import { ImageAppPart } from "./parts/image";
import { MatrixAppPart } from "./parts/matrix";
import { MeshAppPart } from "./parts/mesh";
import { PathAreaAppPart } from "./parts/path-area";
import { PathClipAppPart } from "./parts/path-clip";
import { PathIntersectionAppPart } from "./parts/path-intersection";
import { PathOperationsAppPart } from "./parts/path-operations";
import { PathOverlayAppPart } from "./parts/path-overlay";
import { PlaygroundAppPart } from "./parts/playground";
import { SamplingAppPart } from "./parts/sampling";
import { SkeletonAppPart } from "./parts/skeleton";
import { SnapRoundingAppPart } from "./parts/snaprounding";
import { TriangulateAppPart } from "./parts/triangulate";
import { WebGpuTestAppPart } from "./parts/webgputest";

const context = await AppLauncher.createContext();
const launcher = new AppLauncher(context);
launcher.addCanvas2D("bplustree", AnimationMode.Step, BPlusTreeAppPart);
launcher.addCanvas2D("ecs", AnimationMode.Loop, EcsAppPart);
launcher.addCanvas2D("image", AnimationMode.Step, ImageAppPart);
launcher.addCanvas2D("matrix", AnimationMode.Step, MatrixAppPart);
launcher.addCanvas2D("mesh", AnimationMode.Step, MeshAppPart);
launcher.addCanvas2D("path-area", AnimationMode.Step, PathAreaAppPart);
launcher.addCanvas2D("path-clip", AnimationMode.Step, PathClipAppPart);
launcher.addCanvas2D("path-intersection", AnimationMode.Step, PathIntersectionAppPart);
launcher.addCanvas2D("path-operations", AnimationMode.Step, PathOperationsAppPart);
launcher.addCanvas2D("path-overlay", AnimationMode.Step, PathOverlayAppPart);
launcher.addCanvas2D("playground", AnimationMode.Step, PlaygroundAppPart);
launcher.addCanvas2D("sampling", AnimationMode.Step, SamplingAppPart);
launcher.addCanvas2D("skeleton", AnimationMode.Step, SkeletonAppPart);
launcher.addCanvas2D("snaprounding", AnimationMode.Step, SnapRoundingAppPart);
launcher.addCanvas2D("triangulate", AnimationMode.Step, TriangulateAppPart);
launcher.addCanvasWebGPU("weggpu", AnimationMode.Loop, WebGpuTestAppPart);
launcher.init("playground");

import type { ComponentsIdsOf } from "../ecs/types.js";
import type { Matrix4x4 } from "../primitives/matrix.js";
import type { TransformComponent } from "./transform.js";

export type CameraBundle = [CameraComponent, TransformComponent];
export const CAMERA_BUNDLE_IDS = ["camera", "transform"] satisfies ComponentsIdsOf<CameraBundle>;

export type CameraComponent = {
    componentId: "camera";
    projection: Matrix4x4;
};

import type { Matrix4 } from "redgeometry/src/primitives/matrix";
import type { ComponentIdsOf } from "../ecs/types.js";
import type { World } from "../ecs/world.js";
import type { ComputedTransformComponent, TransformComponent } from "./transform.js";

export type CameraBundle = [CameraComponent, TransformComponent];
export const CAMERA_BUNDLE_IDS = ["camera", "transform"] satisfies ComponentIdsOf<CameraBundle>;

export type CameraComponent = {
    componentId: "camera";
    projection: Matrix4;
    viewProjection: Matrix4;
};

export function cameraSystem(world: World): void {
    for (const entity of world.getEntitiesChanged()) {
        const camera = world.getComponent<CameraComponent>(entity, "camera");

        if (camera === undefined) {
            continue;
        }

        const computedTransform = world.getComponent<ComputedTransformComponent>(entity, "computed-transform");

        if (computedTransform !== undefined) {
            const matView = computedTransform.global.inverse();
            camera.viewProjection.copyFrom(matView);
            camera.viewProjection.mulSet(camera.projection, camera.viewProjection);
        } else {
            camera.viewProjection.copyFrom(camera.projection);
        }
    }
}

import type { ComponentIdsOf } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import type { Matrix4 } from "redgeometry/src/primitives/matrix";
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
            const matInv = computedTransform.global.getInverse();
            camera.viewProjection.set(...matInv.elements, 0, 0, 0, 1);
            camera.viewProjection.mul(camera.projection);
        } else {
            camera.viewProjection.copyFrom(camera.projection);
        }
    }
}

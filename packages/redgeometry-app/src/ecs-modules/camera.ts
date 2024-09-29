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
    const query = world.queryEntities<CameraComponent | ComputedTransformComponent>(
        (q) => q.hasComponent("camera") && (q.isUpdated("camera") || q.isUpdated("computed-transform")),
    );

    while (query.next()) {
        const camera = query.getComponent<CameraComponent>("camera");
        const computedTransform = query.findComponent<ComputedTransformComponent>("computed-transform");

        if (computedTransform !== undefined) {
            const matView = computedTransform.global.inverse();
            camera.viewProjection.copyFromMat4A(matView);
            camera.viewProjection.mulSet(camera.projection, camera.viewProjection);
        } else {
            camera.viewProjection.copyFromMat4(camera.projection);
        }
    }
}

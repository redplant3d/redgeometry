import type { ComponentIdsOf } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";
import type { Matrix4 } from "redgeometry/src/primitives/matrix";
import type { GlobalComponent, TransformComponent } from "./transform.js";

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

        const mat = camera.viewProjection;

        const global = world.getComponent<GlobalComponent>(entity, "global");

        if (global !== undefined) {
            const e = global.transform.getInverse().elements;
            mat.set(e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], e[9], e[10], e[11], 0, 0, 0, 1);
            mat.mul(camera.projection);
        } else {
            mat.copyFrom(camera.projection);
        }
    }
}

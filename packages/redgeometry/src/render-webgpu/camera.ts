import type { Matrix4x4 } from "../primitives/matrix.js";

export type CameraComponent = {
    type: "camera";
    worldMat: Matrix4x4;
    target: GPUColorTargetState;
};

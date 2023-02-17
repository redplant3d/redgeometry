import { Matrix4x4 } from "../primitives";

export type CameraComponent = {
    type: "camera";
    worldMat: Matrix4x4;
    target: GPUColorTargetState;
};

import { Matrix4x4 } from "../primitives";

export type TransformComponent = {
    componentId: "transform";
    local: Matrix4x4;
};

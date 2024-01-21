import { Matrix4 } from "../primitives/matrix.js";

export type TransformComponent = {
    componentId: "transform";
    local: Matrix4;
};

import type { EntityId } from "../ecs/types.js";

export type SceneData = {
    dataId: "scene";
    mainCamera: EntityId;
};

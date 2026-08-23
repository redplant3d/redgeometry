import { assert } from "redgeometry/src/internal/debug";
import type { WorldModuleId } from "./world.ts";

export type WorldDataId = string;
export type WorldData = { readonly dataId: WorldDataId };
export type WorldDataIdOf<T extends WorldData> = T["dataId"];

type WorldDataEntry = {
    data: WorldData | undefined;
};

export class WorldDataStorage {
    public entries: Map<WorldDataId, WorldDataEntry>;

    constructor() {
        this.entries = new Map();
    }

    public get(dataId: WorldDataId): WorldData {
        const entry = this.entries.get(dataId);
        assert(entry !== undefined, "World data '{}' is not registered", dataId);
        assert(entry.data !== undefined, "World data '{}' is not initialized", dataId);

        return entry.data;
    }

    public register(dataId: WorldDataId, moduleId: WorldModuleId): void {
        assert(
            !this.entries.has(dataId),
            "World data '{}' is registered from world module '{}' but has already been registered",
            dataId,
            moduleId,
        );

        this.entries.set(dataId, {
            data: undefined,
        });
    }

    public require(dataId: WorldDataId, moduleId: WorldModuleId): void {
        assert(
            this.entries.has(dataId),
            "World data '{}' is required by world module '{}' but has not been registered",
            dataId,
            moduleId,
        );
    }

    public set(data: WorldData): void {
        const entry = this.entries.get(data.dataId);
        assert(entry !== undefined, "World data '{}' has not been registered in a world module", data.dataId);

        entry.data = data;
    }
}

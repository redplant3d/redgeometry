import { assert } from "redgeometry/src/internal/debug";
import type { WorldModuleId } from "./world.ts";

export type WorldDataId = string;
export type WorldData = { readonly dataId: WorldDataId };
export type WorldDataIdOf<T extends WorldData> = T["dataId"];

export class WorldDataStorage {
    public dataEntries: Map<WorldDataId, WorldData | undefined>;

    constructor() {
        this.dataEntries = new Map();
    }

    public get(dataId: WorldDataId): WorldData {
        const data = this.dataEntries.get(dataId);
        assert(data !== undefined, "World data '{}' is not available", dataId);

        return data;
    }

    public register(dataId: WorldDataId, moduleId: WorldModuleId): void {
        assert(
            !this.dataEntries.has(dataId),
            "World data '{}' is registered from world module '{}' but has already been registered",
            dataId,
            moduleId,
        );

        this.dataEntries.set(dataId, undefined);
    }

    public require(dataId: WorldDataId, moduleId: WorldModuleId): void {
        assert(
            this.dataEntries.has(dataId),
            "World data '{}' is required by world module '{}' but has not been registered",
            dataId,
            moduleId,
        );
    }

    public set(data: WorldData): void {
        assert(
            this.dataEntries.has(data.dataId),
            "World data '{}' has not been registered in a world module",
            data.dataId,
        );

        this.dataEntries.set(data.dataId, data);
    }
}

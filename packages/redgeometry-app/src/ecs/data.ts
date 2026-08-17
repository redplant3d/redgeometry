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

    public register(dataId: WorldDataId, moduleId: WorldModuleId): void {
        assert(
            !this.dataEntries.has(dataId),
            "World data id '{}' is registered in world module id '{}' " +
                "but has already been registered in a world module",
            dataId,
            moduleId,
        );

        this.dataEntries.set(dataId, undefined);
    }

    public require(dataId: WorldDataId, moduleId: WorldModuleId): void {
        assert(
            this.dataEntries.has(dataId),
            "World data id '{}' is required in world module id '{}' " + "but has not been registered in a world module",
            dataId,
            moduleId,
        );
    }

    public set<T extends WorldData>(data: T): void {
        assert(
            this.dataEntries.has(data.dataId),
            "World data id '{}' has not been registered in a world module",
            data.dataId,
        );

        this.dataEntries.set(data.dataId, data);
    }

    public get<T extends WorldData>(dataId: WorldDataIdOf<T>): T {
        const data = this.dataEntries.get(dataId);
        assert(data !== undefined, "World data id '{}' is not available", dataId);

        return data as T;
    }
}

import { assert } from "redgeometry/src/utility/debug";

export type WorldDataId = string;
export type WorldData = { readonly dataId: WorldDataId };
export type WorldDataIdOf<T extends WorldData> = T["dataId"];

export class WorldDataStorage {
    public dataEntries: Map<WorldDataId, WorldData | undefined>;

    constructor() {
        this.dataEntries = new Map();
    }

    public register(dataId: WorldDataId): void {
        const hasData = this.dataEntries.has(dataId);
        assert(!hasData, "World data id '{}' is already registered", dataId);

        this.dataEntries.set(dataId, undefined);
    }

    public require(dataId: WorldDataId): void {
        const hasData = this.dataEntries.has(dataId);
        assert(hasData, "World data id '{}' is required but missing", dataId);
    }

    public set<T extends WorldData>(data: T): void {
        const hasData = this.dataEntries.has(data.dataId);
        assert(hasData, "World data id '{}' is not registered", data.dataId);

        this.dataEntries.set(data.dataId, data);
    }

    public get<T extends WorldData>(dataId: WorldDataIdOf<T>): T {
        const data = this.dataEntries.get(dataId);
        assert(data !== undefined, "World data id '{}' is not available", dataId);

        return data as T;
    }
}

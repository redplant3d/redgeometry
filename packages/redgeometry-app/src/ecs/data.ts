import { assert } from "redgeometry/src/utility/debug";

export type WorldDataId = string;
export type WorldData = { readonly dataId: WorldDataId };
export type WorldDataIdOf<T extends WorldData> = T["dataId"];

export class WorldDataStorage {
    private data: Map<WorldDataId, WorldData | undefined>;

    constructor() {
        this.data = new Map();
    }

    public register(dataId: WorldDataId): void {
        const hasData = this.data.has(dataId);
        assert(!hasData, "World data id '{}' is already registered", dataId);

        this.data.set(dataId, undefined);
    }

    public require(dataId: WorldDataId): void {
        const hasData = this.data.has(dataId);
        assert(hasData, "World data id '{}' is required but missing", dataId);
    }

    public set<T extends WorldData>(data: T): void {
        this.data.set(data.dataId, data);
    }

    public get<T extends WorldData>(dataId: WorldDataIdOf<T>): T {
        const data = this.data.get(dataId);
        assert(data !== undefined, "World data id '{}' is not available", dataId);

        return data as T;
    }
}

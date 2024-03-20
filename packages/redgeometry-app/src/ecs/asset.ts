import type { Nominal } from "redgeometry/src/utility/types";
import type { Material } from "./material.js";
import type { Mesh } from "./mesh.js";

export type AssetId<T> = Nominal<number, "AssetId" & T>;

export type AssetData = {
    dataId: "asset";
    meshes: AssetCollection<Mesh>;
    materials: AssetCollection<Material>;
};

export class AssetCollection<T> {
    private id: number;

    public entries: Map<AssetId<T>, T>;

    constructor() {
        this.entries = new Map();
        this.id = 0;
    }

    public add(data: T): AssetId<T> {
        const handle = this.createNewId();
        this.entries.set(handle, data);
        return handle;
    }

    public remove(handle: AssetId<T>): boolean {
        return this.entries.delete(handle);
    }

    private createNewId(): AssetId<T> {
        // TODO: Proper generation
        const handle = this.id;
        this.id += +1;
        return handle as AssetId<T>;
    }
}
